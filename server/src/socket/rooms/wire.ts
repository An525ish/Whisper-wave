import { AppError } from '../../utils/AppError.js';
import { ROOM_ERROR_CODES } from '../../constants/room-events.js';
import type { LiveRoomMessage, RoomAckCode, WireRoomMessage } from '../../types/room.js';

/**
 * The ONLY mapper from a ring message to a client payload. It names fields
 * explicitly, so `senderGid` / `senderUserId` (server-only offender identity)
 * can never ride along. `hidden` is surfaced to mods only.
 */
export const toWireMessage = (m: LiveRoomMessage, opts: { forMod?: boolean } = {}): WireRoomMessage => ({
  id: m.id,
  from: { alias: m.alias, color: m.color, role: m.role, ...(m.avatar ? { avatar: m.avatar } : {}) },
  text: m.text,
  // `key` stays server-side; clients only ever get the kind and the URL.
  ...(m.media ? { media: { kind: m.media.kind, url: m.media.url } } : {}),
  ts: m.ts,
  ...(m.replyTo ? { replyTo: m.replyTo } : {}),
  ...(m.system ? { system: true as const } : {}),
  ...(opts.forMod && m.hidden ? { hidden: true as const } : {}),
});

const KNOWN_CODES = new Set<string>(Object.values(ROOM_ERROR_CODES));

/** Service errors carry their stable code as the message; anything else is `unknown` (never prose to the client). */
export const ackCodeOf = (err: unknown): RoomAckCode =>
  err instanceof AppError && KNOWN_CODES.has(err.message) ? (err.message as RoomAckCode) : 'unknown';

/** Copy for the three rejections `onSocketEvent` makes on its own — each carries a code. */
export const ROOM_REJECTIONS = {
  rateLimited: { code: ROOM_ERROR_CODES.RATE_LIMITED, reason: 'Too many requests — slow down a little.' },
  invalidPayload: { code: ROOM_ERROR_CODES.INVALID_PAYLOAD, reason: 'That request could not be understood.' },
  handlerFailed: { code: ROOM_ERROR_CODES.UNKNOWN, reason: 'Something went wrong.' },
};
