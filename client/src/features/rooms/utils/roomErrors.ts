import { ROOM_FAIL_COPY } from '../constants';
import type { RoomAckCode, RoomEndKind } from '../types';

const isAckCode = (value: unknown): value is RoomAckCode =>
  typeof value === 'string' && value in ROOM_FAIL_COPY;

/** Copy for any ack/error code; anything the server adds later reads as `unknown`. */
export const failCopy = (code: unknown): string =>
  ROOM_FAIL_COPY[isAckCode(code) ? code : 'unknown'];

/** `err.data.code` of a refused socket handshake, when the server set one. */
export const handshakeCode = (err: unknown): RoomAckCode | null => {
  if (typeof err !== 'object' || err === null || !('data' in err)) return null;
  const data = err.data;
  if (typeof data !== 'object' || data === null || !('code' in data)) return null;
  return isAckCode(data.code) ? data.code : null;
};

/**
 * Codes that end the visit (full-page card) rather than failing one action.
 * `alias_invalid`, `locked`, rate limits etc. stay inline.
 */
const END_KIND: Partial<Record<RoomAckCode, RoomEndKind>> = {
  banned: 'banned',
  closed: 'closed',
  not_found: 'not_found',
  feature_off: 'switched_off',
  identity_required: 'identity_required',
};

export const endKindOf = (code: RoomAckCode): RoomEndKind | null => END_KIND[code] ?? null;
