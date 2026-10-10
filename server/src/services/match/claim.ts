import { getRedis } from '../../config/redis.js';
import type { VibeTag } from '../../types/match.js';
import { REDIS_KEYS, TTL } from './keys.js';

/**
 * A mutual-like claim: the proof of a seat that outlives the tab.
 *
 * Written at mutual like for both seats. The `connectToken` alternative dies
 * with `sessionStorage` (~10 min); the claim lives 7 days keyed by the
 * `anonId` cookie, which survives a closed tab on the same browser. Redeeming
 * it runs the same seat-binding path as a token, so the cookie is as strong a
 * proof of seat as the token was.
 */
export type ConnectionClaim = {
  sessionId: string;
  /** Holder's seat: 0 = anon1, 1 = anon2. */
  seat: 0 | 1;
  originNames: [string, string];
  originTags: [VibeTag[], VibeTag[]];
  createdAt: number;
};

const parse = (raw: string | null): ConnectionClaim | null => {
  if (!raw) return null;
  try {
    const claim = JSON.parse(raw) as ConnectionClaim;
    if (
      typeof claim.sessionId !== 'string' ||
      (claim.seat !== 0 && claim.seat !== 1) ||
      !Array.isArray(claim.originNames) ||
      !Array.isArray(claim.originTags)
    ) {
      return null;
    }
    return claim;
  } catch {
    return null;
  }
};

/** Store (or refresh) the claim for one seat. Best-effort — callers never await failure. */
export const saveClaim = async (anonId: string, claim: ConnectionClaim): Promise<void> => {
  await getRedis().set(REDIS_KEYS.claim(anonId), JSON.stringify(claim), 'EX', TTL.claim);
};

/** Read a claim without consuming it (pending list). */
export const peekClaim = async (anonId: string): Promise<ConnectionClaim | null> =>
  parse(await getRedis().get(REDIS_KEYS.claim(anonId)));

/** Atomically take a claim for redemption. Second redeemer gets null. */
export const takeClaim = async (anonId: string): Promise<ConnectionClaim | null> =>
  parse(await getRedis().getdel(REDIS_KEYS.claim(anonId)));

/** Discard a claim (cancel flow). Missing is fine — expiry already did it. */
export const deleteClaim = async (anonId: string): Promise<void> => {
  await getRedis().del(REDIS_KEYS.claim(anonId));
};
