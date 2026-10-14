import type { Namespace } from 'socket.io';
import { isSeated, membersOf, onInstanceClosed, removeMember } from '../../services/rooms/registry.js';
import { ROOM_MOD_ACTION, ROOM_PRESENCE } from '../../constants/room-events.js';
import type { RoomSocket } from '../../types/room.js';

/**
 * Which sockets hold each seat. A seat (userId, else gid) can be held by
 * several tabs; it leaves the registry only when the LAST socket lets go, and
 * mod notices reach every one of them. instanceId → seat key → socket ids.
 */
const seats = new Map<string, Map<string, Set<string>>>();

/** Presence fan-out: at most once per window, with a trailing emit for the latest count. */
const PRESENCE_THROTTLE_MS = 5_000;
const lastPresenceEmit = new Map<string, number>();
const trailing = new Map<string, NodeJS.Timeout>();

onInstanceClosed((instanceId) => {
  seats.delete(instanceId);
  lastPresenceEmit.delete(instanceId);
  const timer = trailing.get(instanceId);
  if (timer) clearTimeout(timer);
  trailing.delete(instanceId);
});

export const seatKeyOf = (socket: RoomSocket): string => socket.userId ?? socket.gid;

export const trackSeat = (instanceId: string, key: string, socketId: string): void => {
  const inner = seats.get(instanceId) ?? new Map<string, Set<string>>();
  const sockets = inner.get(key) ?? new Set<string>();
  sockets.add(socketId);
  inner.set(key, sockets);
  seats.set(instanceId, inner);
};

/** Forget one socket's hold on a seat; returns how many sockets still hold it. */
export const untrackSeat = (instanceId: string, key: string, socketId: string): number => {
  const inner = seats.get(instanceId);
  const sockets = inner?.get(key);
  if (!inner || !sockets) return 0;
  sockets.delete(socketId);
  if (sockets.size === 0) inner.delete(key);
  return sockets.size;
};

export const seatSockets = (instanceId: string, key: string): string[] => [
  ...(seats.get(instanceId)?.get(key) ?? []),
];

export const emitPresence = (nsp: Namespace, instanceId: string): void => {
  const send = (): void => {
    trailing.delete(instanceId);
    lastPresenceEmit.set(instanceId, Date.now());
    const online = membersOf(instanceId).length;
    if (online > 0) nsp.to(instanceId).emit(ROOM_PRESENCE, { online });
  };
  const wait = PRESENCE_THROTTLE_MS - (Date.now() - (lastPresenceEmit.get(instanceId) ?? 0));
  if (wait <= 0) {
    send();
    return;
  }
  if (!trailing.has(instanceId)) trailing.set(instanceId, setTimeout(send, wait).unref());
};

/**
 * The instance this socket may act in RIGHT NOW. `roomInstanceId` alone is not
 * proof — a kick, ban or close can have removed the seat — so every handler
 * resolves through here and a stale pointer is cleared.
 */
export const currentInstance = (socket: RoomSocket): string | null => {
  const instanceId = socket.roomInstanceId;
  if (!instanceId) return null;
  if (isSeated(instanceId, seatKeyOf(socket))) return instanceId;
  socket.leave(instanceId);
  socket.roomInstanceId = undefined;
  return null;
};

/** This socket stops being in `instanceId`: untrack fully, free the seat if it was the last tab, refresh presence. */
export const releaseSeat = (nsp: Namespace, socket: RoomSocket, instanceId: string): void => {
  const key = seatKeyOf(socket);
  socket.leave(instanceId);
  if (socket.roomInstanceId === instanceId) socket.roomInstanceId = undefined;
  if (untrackSeat(instanceId, key, socket.id) === 0) {
    removeMember(instanceId, key);
  }
  emitPresence(nsp, instanceId);
};

/** Remove a whole seat (kick/ban): every tab is told, left out of the room and untracked. */
export const evictSeat = (
  nsp: Namespace,
  instanceId: string,
  key: string,
  action: 'kicked' | 'banned'
): number => {
  const socketIds = seatSockets(instanceId, key);
  for (const id of socketIds) {
    const socket = nsp.sockets.get(id) as RoomSocket | undefined;
    if (!socket) continue;
    socket.emit(ROOM_MOD_ACTION, { action });
    socket.leave(instanceId);
    if (socket.roomInstanceId === instanceId) socket.roomInstanceId = undefined;
    untrackSeat(instanceId, key, id);
  }
  removeMember(instanceId, key);
  emitPresence(nsp, instanceId);
  return socketIds.length;
};
