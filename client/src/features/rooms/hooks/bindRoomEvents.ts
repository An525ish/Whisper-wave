import type { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { ROOM_CLOSED_REASON, ROOM_SOCKET, SOCKET_LIFECYCLE } from '@/shared/constants/socket';
import { useRoomStore } from '../stores/roomStore';
import { endKindOf, failCopy, handshakeCode } from '../utils/roomErrors';
import { emitJoin } from './roomEmitters';
import type {
  RoomMessage,
  RoomModNotice,
  RoomReactionPayload,
  RoomStatePayload,
} from '../types';

const MS_PER_MINUTE = 60_000;

/** The room-wide and to-the-target moderation notices. */
const applyModNotice = (notice: RoomModNotice): void => {
  const store = useRoomStore.getState();
  switch (notice.action) {
    case 'delete':
      store.deleteMessage(notice.messageId);
      break;
    case 'unhide':
      store.restoreMessage(notice.message);
      break;
    case 'kick':
      store.appendNotice(`${notice.targetAlias} was removed`);
      break;
    case 'kicked':
      store.setEnd({ kind: 'kicked' });
      break;
    case 'banned':
      store.setEnd({ kind: 'banned' });
      break;
    case 'muted':
      store.setMutedUntil(Date.now() + notice.minutes * MS_PER_MINUTE);
      toast(`You were muted for ${notice.minutes} min.`);
      break;
    case 'locked':
      toast('This room is locked — no new joins for now.');
      break;
    case 'unlocked':
      toast('This room is open again.');
      break;
    case 'slow':
      toast(notice.ms > 0 ? `Slow mode: one message per ${Math.round(notice.ms / 1000)}s.` : 'Slow mode off.');
      break;
  }
};

/** `ROOM_CLOSED`: the flag, a restart, or an admin close (prose). */
const applyClosed = (reason: string): void => {
  const store = useRoomStore.getState();
  if (reason === ROOM_CLOSED_REASON.DISABLED) store.setEnd({ kind: 'switched_off' });
  else if (reason === ROOM_CLOSED_REASON.RESTART) store.setEnd({ kind: 'restarted' }, { keepParams: true });
  else store.setEnd({ kind: 'closed', ...(reason ? { detail: reason } : {}) });
};

/**
 * Re-seat a socket that dropped mid-visit: the server forgot the seat, the
 * store still holds the persona. A failure that ends the visit shows its card;
 * anything else returns to the rules sheet with the reason inline.
 */
const rejoin = async (socket: Socket, slug: string): Promise<void> => {
  const { joinParams } = useRoomStore.getState();
  if (!joinParams) return;
  const res = await emitJoin(socket, slug, joinParams);
  if (res.ok) return;
  const kind = endKindOf(res.code);
  const store = useRoomStore.getState();
  if (kind) store.setEnd({ kind });
  else store.joinFailed(res.code);
};

/**
 * Wire every `/rooms` event and lifecycle callback to the store. Handlers only
 * write the store (and toast); the screens read it.
 */
export function bindRoomEvents(socket: Socket, slug: string): void {
  const store = useRoomStore.getState;

  socket.on(SOCKET_LIFECYCLE.CONNECT, () => {
    store().setSocketStatus('online');
    if (store().joinStatus === 'rejoining') void rejoin(socket, slug);
  });
  socket.on(SOCKET_LIFECYCLE.DISCONNECT, () => {
    store().setSocketStatus('offline');
    store().markRejoining();
  });
  socket.on(SOCKET_LIFECYCLE.CONNECT_ERROR, (err: unknown) => {
    store().setSocketStatus('offline');
    const code = handshakeCode(err);
    const kind = code ? endKindOf(code) : null;
    if (kind) store().setEnd({ kind });
  });

  socket.on(ROOM_SOCKET.STATE, (state: RoomStatePayload) => store().applyState(state));
  socket.on(ROOM_SOCKET.MESSAGE, (message: RoomMessage) => store().appendMessage(message));
  socket.on(ROOM_SOCKET.PRESENCE, (payload: { online?: number }) => store().setPresence(payload.online ?? 0));
  socket.on(ROOM_SOCKET.REACTION, (p: RoomReactionPayload) => store().applyReaction(p.messageId, p.counts));
  socket.on(ROOM_SOCKET.MOD_ACTION, applyModNotice);
  socket.on(ROOM_SOCKET.PAUSED, () => store().setPaused(true));
  socket.on(ROOM_SOCKET.RESUMED, () => store().setPaused(false));
  socket.on(ROOM_SOCKET.CLOSED, (payload: { reason?: string }) => applyClosed(payload.reason ?? ''));
  socket.on(ROOM_SOCKET.ERROR, (payload: { code?: string }) => {
    // A refused join also answers its ack — that path owns the message.
    const { joinStatus } = store();
    if (joinStatus === 'joining' || joinStatus === 'rejoining') return;
    if (payload.code === 'feature_off') store().setEnd({ kind: 'switched_off' });
    else toast(failCopy(payload.code));
  });
}
