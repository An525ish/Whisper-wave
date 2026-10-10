/**
 * `/rooms` event names — the single source both directions.
 *
 * Mirrored on the client in `shared/constants/socket.ts` when the client
 * slice lands (existing convention). Acked events answer `{ ok: true, … }`
 * or `{ ok: false, code }` — `code` is the stable contract, never prose.
 */
export const ROOM_JOIN = 'ROOM_JOIN';
export const ROOM_LEAVE = 'ROOM_LEAVE';
export const ROOM_MESSAGE = 'ROOM_MESSAGE';
export const ROOM_REACT = 'ROOM_REACT';
export const ROOM_MOD = 'ROOM_MOD';

/** Client → server. */
export const ROOM_CLIENT_EVENTS = [ROOM_JOIN, ROOM_LEAVE, ROOM_MESSAGE, ROOM_REACT, ROOM_MOD] as const;

/** Server → client. */
export const ROOM_STATE = 'ROOM_STATE';
export const ROOM_MESSAGE_EVENT = 'ROOM_MESSAGE';
export const ROOM_PRESENCE = 'ROOM_PRESENCE';
export const ROOM_REACTION = 'ROOM_REACTION';
export const ROOM_MOD_ACTION = 'ROOM_MOD_ACTION';
export const ROOM_CLOSED = 'ROOM_CLOSED';
export const ROOM_ERROR = 'ROOM_ERROR';

/**
 * Machine-readable failure codes. Thrown as `AppError` messages by the
 * membership service so the namespace can forward them untouched.
 */
export const ROOM_ERROR_CODES = {
  NOT_FOUND: 'not_found',
  CLOSED: 'closed',
  BANNED: 'banned',
  NOT_JOINED: 'not_joined',
  RATE_LIMITED: 'rate_limited',
  LOCKED: 'locked',
  INVITE_REQUIRED: 'invite_required',
  INVITE_INVALID: 'invite_invalid',
} as const;
