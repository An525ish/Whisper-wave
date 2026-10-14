import type { RoomAckCode } from '../types/room.js';

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

/** Server → client (`ROOM_MESSAGE` is also the server → client fan-out name). */
export const ROOM_STATE = 'ROOM_STATE';
export const ROOM_PRESENCE = 'ROOM_PRESENCE';
export const ROOM_REACTION = 'ROOM_REACTION';
export const ROOM_MOD_ACTION = 'ROOM_MOD_ACTION';
export const ROOM_CLOSED = 'ROOM_CLOSED';
export const ROOM_ERROR = 'ROOM_ERROR';
/** Listening rooms: posting paused (no mod present after grace) / resumed (a mod seated). Payload `{ slug }`. */
export const ROOM_PAUSED = 'ROOM_PAUSED';
export const ROOM_RESUMED = 'ROOM_RESUMED';

/**
 * Machine-readable failure codes. Thrown as `AppError` messages by the
 * membership service so the namespace can forward them untouched. The union
 * the client mirrors is `RoomAckCode` in `types/room.ts`.
 *
 * Unlisted-without-invite, bad invite and unknown slug all answer NOT_FOUND on
 * purpose: a distinct code would let anyone enumerate private slugs.
 */
export const ROOM_ERROR_CODES = {
  FEATURE_OFF: 'feature_off',
  IDENTITY_REQUIRED: 'identity_required',
  MEMBERS_ONLY: 'members_only',
  NOT_FOUND: 'not_found',
  CLOSED: 'closed',
  BANNED: 'banned',
  NOT_JOINED: 'not_joined',
  RATE_LIMITED: 'rate_limited',
  LOCKED: 'locked',
  FORBIDDEN: 'forbidden',
  INVALID_PAYLOAD: 'invalid_payload',
  ALIAS_INVALID: 'alias_invalid',
  JOIN_IN_PROGRESS: 'join_in_progress',
  MOD_ABSENT: 'mod_absent',
  CHALLENGE_UNAVAILABLE: 'challenge_unavailable',
  UNKNOWN: 'unknown',
} as const satisfies Record<string, RoomAckCode>;

/** `ROOM_CLOSED` reasons the server emits as literals; admin closes carry prose. */
export const ROOM_CLOSED_DISABLED = 'disabled';
export const ROOM_CLOSED_RESTART = 'restart';
