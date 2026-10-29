import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { Server } from 'socket.io';
import { closeAllRooms, createRoomsNamespace, evictIdentity } from '../index.js';
import { handleRoomConnection } from '../handlers.js';
import { applyRoomAuth } from '../auth.js';
import { releaseSeat, seatSockets, trackSeat } from '../seats.js';
import { setFeatureFlag } from '../../../services/hub.js';
import { clearRegistry, isSeated, joinInstance } from '../../../services/rooms/registry.js';
import type { RoomSocket } from '../../../types/room.js';

type Emitted = { target: string; event: string; payload: unknown };

/** Namespace double: records emits, holds sockets, answers `to(...)`. */
const makeNsp = () => {
  const emitted: Emitted[] = [];
  const sockets = new Map<string, RoomSocket>();
  const nsp = {
    sockets,
    emitted,
    emit: (event: string, payload: unknown) => emitted.push({ target: '*', event, payload }),
    to: (target: string | string[]) => ({
      emit: (event: string, payload: unknown) =>
        emitted.push({ target: Array.isArray(target) ? target.join(',') : target, event, payload }),
    }),
    use: () => undefined,
    on: () => undefined,
  };
  return nsp;
};

const makeSocket = (id: string, gid: string, userId?: string): RoomSocket & { events: Emitted[]; left: string[]; dropped: boolean } => {
  const events: Emitted[] = [];
  const left: string[] = [];
  const socket = {
    id,
    gid,
    userId,
    events,
    left,
    dropped: false,
    roomInstanceId: undefined as string | undefined,
    emit: (event: string, payload: unknown) => events.push({ target: id, event, payload }),
    leave: (room: string) => left.push(room),
    disconnect() {
      socket.dropped = true;
    },
  };
  return socket as never;
};

const template = { slug: 'sock-room', title: 'T', capSoft: 10, capHard: 20 };

const seatSocket = (nsp: ReturnType<typeof makeNsp>, socket: RoomSocket, alias: string) => {
  const { instanceId } = joinInstance({
    template,
    identity: socket.userId ? { kind: 'member', userId: socket.userId, gid: socket.gid } : { kind: 'guest', gid: socket.gid },
    alias,
    color: '#fff',
  });
  socket.roomInstanceId = instanceId;
  trackSeat(instanceId, socket.userId ?? socket.gid, socket.id);
  nsp.sockets.set(socket.id, socket);
  return instanceId;
};

describe('seat refcount across tabs', () => {
  it('keeps the seat until the last tab leaves', () => {
    clearRegistry();
    const nsp = makeNsp();
    const tab1 = makeSocket('s1', 'g-multi');
    const tab2 = makeSocket('s2', 'g-multi');
    const instanceId = seatSocket(nsp, tab1, 'Multi');
    seatSocket(nsp, tab2, 'Multi');
    assert.deepStrictEqual(seatSockets(instanceId, 'g-multi').sort(), ['s1', 's2']);

    releaseSeat(nsp as never, tab1, instanceId);
    assert.equal(isSeated(instanceId, 'g-multi'), true);
    assert.equal(tab1.roomInstanceId, undefined);
    assert.deepStrictEqual(seatSockets(instanceId, 'g-multi'), ['s2']);

    releaseSeat(nsp as never, tab2, instanceId);
    assert.equal(isSeated(instanceId, 'g-multi'), false);
    clearRegistry();
  });
});

describe('evictIdentity', () => {
  it('removes every tab of the identity, tells them, clears pointers; leaves others alone', () => {
    clearRegistry();
    const nsp = makeNsp();
    const a1 = makeSocket('a1', 'g-bad');
    const a2 = makeSocket('a2', 'g-bad');
    const other = makeSocket('o1', 'g-ok');
    const instanceId = seatSocket(nsp, a1, 'Bad');
    seatSocket(nsp, a2, 'Bad');
    seatSocket(nsp, other, 'Fine');
    const io = { of: () => nsp } as unknown as Server;

    assert.equal(evictIdentity(io, { gid: 'g-bad' }, { reason: 'banned' }), 1);
    for (const s of [a1, a2]) {
      assert.equal(s.roomInstanceId, undefined);
      assert.ok(s.left.includes(instanceId));
      assert.deepStrictEqual(s.events.find((e) => e.event === 'ROOM_MOD_ACTION')?.payload, { action: 'banned' });
      assert.equal(s.dropped, false);
    }
    assert.equal(isSeated(instanceId, 'g-bad'), false);
    assert.equal(isSeated(instanceId, 'g-ok'), true);
    assert.equal(other.roomInstanceId, instanceId);
    // Unknown identity and out-of-scope slug evict nothing.
    assert.equal(evictIdentity(io, { gid: 'nobody' }), 0);
    assert.equal(evictIdentity(io, { gid: 'g-ok' }, { slug: 'elsewhere', reason: 'kicked' }), 0);
    clearRegistry();
  });

  it('matches by userId too', () => {
    clearRegistry();
    const nsp = makeNsp();
    const s = makeSocket('u1', 'g-u', 'user-9');
    const instanceId = seatSocket(nsp, s, 'Member');
    const io = { of: () => nsp } as unknown as Server;
    assert.equal(evictIdentity(io, { userId: 'user-9' }, { reason: 'banned' }), 1);
    assert.equal(isSeated(instanceId, 'user-9'), false);
    clearRegistry();
  });
});

describe('rooms feature flag', () => {
  it('refuses every event and the handshake while off, serves them while on', () => {
    const middlewares: Array<(ev: unknown[], next: () => void) => void> = [];
    const socket = {
      ...makeSocket('f1', 'g-flag'),
      use: (fn: (typeof middlewares)[number]) => middlewares.push(fn),
      on: () => undefined,
    } as unknown as RoomSocket;
    handleRoomConnection(makeNsp() as never, socket);

    const acks: unknown[] = [];
    let passed = 0;
    const send = () => middlewares[0]?.(['ROOM_MESSAGE', { text: 'x' }, (r: unknown) => acks.push(r)], () => (passed += 1));

    // Default test env ships rooms dark.
    send();
    assert.deepStrictEqual(acks, [{ ok: false, code: 'feature_off' }]);
    assert.equal(passed, 0);

    let refusal: { data?: { code?: string } } | undefined;
    applyRoomAuth(socket, (err) => (refusal = err));
    assert.equal(refusal?.data?.code, 'feature_off');

    setFeatureFlag('rooms', true);
    try {
      send();
      assert.equal(passed, 1);
    } finally {
      setFeatureFlag('rooms', null);
    }
  });

  it('closing the flag at runtime ends every room and drops every room socket', () => {
    clearRegistry();
    const nsp = makeNsp();
    const s = makeSocket('d1', 'g-dis');
    const instanceId = seatSocket(nsp, s, 'Reader');
    const io = { of: () => nsp } as unknown as Server;
    createRoomsNamespace(io);

    setFeatureFlag('rooms', true);
    setFeatureFlag('rooms', false);
    try {
      assert.ok(nsp.emitted.some((e) => e.event === 'ROOM_CLOSED' && (e.payload as { reason: string }).reason === 'disabled'));
      assert.equal(s.dropped, true);
      assert.equal(s.roomInstanceId, undefined);
      assert.equal(isSeated(instanceId, 'g-dis'), false);
    } finally {
      setFeatureFlag('rooms', null);
    }
  });

  it('closeAllRooms for a restart notifies without disconnecting', () => {
    clearRegistry();
    const nsp = makeNsp();
    const s = makeSocket('r1', 'g-res');
    seatSocket(nsp, s, 'Reader');
    closeAllRooms({ of: () => nsp } as unknown as Server, 'restart', { disconnect: false });
    assert.ok(nsp.emitted.some((e) => e.event === 'ROOM_CLOSED' && (e.payload as { reason: string }).reason === 'restart'));
    assert.equal(s.dropped, false);
    clearRegistry();
  });
});
