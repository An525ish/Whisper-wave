import { getRedis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import type { ConnectionClaim } from '../../types/connection.js';
import { REDIS_KEYS, TTL } from './keys.js';

/**
 * Mutual-like claims: the proof of a seat that outlives the tab.
 *
 * Written at mutual like for both seats. The `connectToken` alternative dies
 * with `sessionStorage` (~10 min); the claim lives 7 days keyed by the
 * `anonId` cookie *and* the session, so two mutual likes on one browser
 * coexist. A small per-anonId index Set (`match:claims:{anonId}`) lists them
 * without SCAN. Redeeming a claim runs the same seat-binding path as a token,
 * so the cookie is as strong a proof of seat as the token was.
 */

/** Most claims one browser can list — a day of anonId cookie never gets near it. */
const MAX_LISTED = 20;

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
  } catch (err) {
    logger.warn({ err }, 'Discarding unparseable connection claim');
    return null;
  }
};

/** Store (or refresh) the claim for one seat — one pipelined round trip. */
export const saveClaim = async (anonId: string, claim: ConnectionClaim): Promise<void> => {
  const index = REDIS_KEYS.claimIndex(anonId);
  await getRedis()
    .pipeline()
    .set(REDIS_KEYS.claim(anonId, claim.sessionId), JSON.stringify(claim), 'EX', TTL.claim)
    .sadd(index, claim.sessionId)
    .expire(index, TTL.claim)
    .exec();
};

/** Read one claim without consuming it. */
export const peekClaim = async (
  anonId: string,
  sessionId: string
): Promise<ConnectionClaim | null> =>
  parse(await getRedis().get(REDIS_KEYS.claim(anonId, sessionId)));

/** Every live claim on this browser (pending list). Prunes expired index members. */
export const listClaims = async (anonId: string): Promise<ConnectionClaim[]> => {
  const redis = getRedis();
  const index = REDIS_KEYS.claimIndex(anonId);
  const sessionIds = (await redis.smembers(index)).slice(0, MAX_LISTED);
  if (sessionIds.length === 0) return [];
  const raws = await redis.mget(sessionIds.map((id) => REDIS_KEYS.claim(anonId, id)));
  const claims: ConnectionClaim[] = [];
  const dead: string[] = [];
  raws.forEach((raw, i) => {
    const claim = parse(raw);
    if (claim) claims.push(claim);
    else dead.push(sessionIds[i] as string);
  });
  if (dead.length > 0) {
    await redis
      .srem(index, ...dead)
      .catch((err: unknown) => logger.warn({ err }, 'Failed to prune expired claim index entries'));
  }
  return claims;
};

/** Atomically take a claim for redemption. Second redeemer gets null. */
export const takeClaim = async (
  anonId: string,
  sessionId: string
): Promise<ConnectionClaim | null> => {
  const redis = getRedis();
  const claim = parse(await redis.getdel(REDIS_KEYS.claim(anonId, sessionId)));
  await redis.srem(REDIS_KEYS.claimIndex(anonId), sessionId);
  return claim;
};

/** Discard a claim (cancel / already-bound cleanup). Missing is fine — expiry already did it. */
export const deleteClaim = async (anonId: string, sessionId: string): Promise<void> => {
  await getRedis()
    .pipeline()
    .del(REDIS_KEYS.claim(anonId, sessionId))
    .srem(REDIS_KEYS.claimIndex(anonId), sessionId)
    .exec();
};
