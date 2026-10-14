import type { Socket } from 'socket.io-client';
import { ROOM_SOCKET } from '@/shared/constants/socket';
import { ROOM_ACK_TIMEOUT_MS } from '../constants';
import type {
  RoomActionAck,
  RoomJoinAck,
  RoomJoinParams,
  RoomMessageAck,
  RoomMessageInput,
  RoomModAction,
  RoomReactionKey,
} from '../types';

/** What every emit resolves to when the server never answered (timeout, drop). */
const NO_ANSWER = { ok: false, code: 'unknown' } as const;

/** Emit and wait for the ack; a timeout or dropped socket reads as `unknown`. */
const emitAcked = async <Ack>(socket: Socket, event: string, payload: unknown, fallback: Ack): Promise<Ack> => {
  try {
    const res: Ack | undefined = await socket.timeout(ROOM_ACK_TIMEOUT_MS).emitWithAck(event, payload);
    return res ?? fallback;
  } catch {
    return fallback;
  }
};

export const emitJoin = (socket: Socket, slug: string, params: RoomJoinParams): Promise<RoomJoinAck> =>
  emitAcked<RoomJoinAck>(socket, ROOM_SOCKET.JOIN, { slug, ...params }, NO_ANSWER);

export const emitMessage = (socket: Socket, input: RoomMessageInput): Promise<RoomMessageAck> =>
  emitAcked<RoomMessageAck>(socket, ROOM_SOCKET.MESSAGE, input, NO_ANSWER);

/** The wire carries the reaction KEY (`heart`), never the glyph. */
export const emitReaction = (socket: Socket, messageId: string, reaction: RoomReactionKey): Promise<RoomActionAck> =>
  emitAcked<RoomActionAck>(socket, ROOM_SOCKET.REACT, { messageId, reaction }, NO_ANSWER);

export const emitMod = (socket: Socket, action: RoomModAction): Promise<RoomActionAck> =>
  emitAcked<RoomActionAck>(socket, ROOM_SOCKET.MOD, action, NO_ANSWER);

export const emitLeave = (socket: Socket): void => {
  socket.emit(ROOM_SOCKET.LEAVE, {});
};
