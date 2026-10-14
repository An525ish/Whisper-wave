import type { Namespace } from 'socket.io';
import { ROOM_ERROR_CODES, ROOM_MESSAGE, ROOM_REACTION } from '../../constants/room-events.js';
import { postRoomMessage } from '../../services/rooms/messaging.js';
import { toggleReaction } from '../../services/rooms/registry.js';
import { roomReactionLimiter } from '../../services/rooms/rateLimit.js';
import { currentInstance, seatKeyOf, seatSockets } from './seats.js';
import { toWireMessage } from './wire.js';
import type { RoomMessageInput, RoomReactInput, RoomSocket } from '../../types/room.js';

/**
 * Post a message. Returns the ack body.
 *
 * Ids are server-minted; the sender's optimistic id comes back as `clientId`
 * so the client can settle its pending bubble. A shadow-muted post is echoed
 * to ALL of the sender's tabs and nobody else.
 */
export const handleMessage = async (
  nsp: Namespace,
  socket: RoomSocket,
  input: RoomMessageInput
): Promise<Record<string, unknown>> => {
  const clientId = input.id ? { clientId: input.id } : {};
  const instanceId = currentInstance(socket);
  if (!instanceId) return { ok: false, code: ROOM_ERROR_CODES.NOT_JOINED, ...clientId };

  const result = await postRoomMessage({
    instanceId,
    identity: socket.userId
      ? { kind: 'member', userId: socket.userId, gid: socket.gid }
      : { kind: 'guest', gid: socket.gid },
    text: input.text,
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    ...(input.challenge ? { challenge: input.challenge } : {}),
  });

  if ('ok' in result) {
    return {
      ok: false,
      code: result.code,
      ...(result.retryAfterMs ? { retryAfterMs: result.retryAfterMs } : {}),
      ...(result.challenge ? { challenge: result.challenge } : {}),
      ...(result.support ? { support: true } : {}),
      ...clientId,
    };
  }

  const wire = toWireMessage(result.message);
  if (result.shadowed) {
    nsp.to(seatSockets(instanceId, seatKeyOf(socket))).emit(ROOM_MESSAGE, wire);
  } else {
    nsp.to(instanceId).emit(ROOM_MESSAGE, wire);
  }
  return { ok: true, id: result.message.id, ...(result.support ? { support: true } : {}), ...clientId };
};

/** Toggle a curated reaction on a message of the CURRENT instance. Returns the ack body. */
export const handleReact = (
  nsp: Namespace,
  socket: RoomSocket,
  input: RoomReactInput
): Record<string, unknown> => {
  const instanceId = currentInstance(socket);
  if (!instanceId) return { ok: false, code: ROOM_ERROR_CODES.NOT_JOINED };
  const key = seatKeyOf(socket);
  if (!roomReactionLimiter.allow(key)) return { ok: false, code: ROOM_ERROR_CODES.RATE_LIMITED };

  const counts = toggleReaction(instanceId, key, input.messageId, input.reaction);
  if (!counts) return { ok: false, code: ROOM_ERROR_CODES.NOT_FOUND };
  nsp.to(instanceId).emit(ROOM_REACTION, {
    messageId: input.messageId,
    reaction: input.reaction,
    count: counts[input.reaction] ?? 0,
  });
  return { ok: true, counts };
};
