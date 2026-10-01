import { getRedis } from '../../config/redis.js';
import { REDIS_KEYS, TTL } from './keys.js';

/** Block anonId `target` from being matched with `blocker`. */
export const blockAnonId = async (blocker: string, target: string): Promise<void> => {
  const redis = getRedis();
  await redis.sadd(REDIS_KEYS.blocked(blocker), target);
  await redis.expire(REDIS_KEYS.blocked(blocker), TTL.blocked);
};

/** Check whether `blocker` has blocked `target`. */
export const isBlocked = async (blocker: string, target: string): Promise<boolean> => {
  const result = await getRedis().sismember(REDIS_KEYS.blocked(blocker), target);
  return result === 1;
};

/** Check the block relationship in both directions. */
export const isBlockedEitherWay = async (a: string, b: string): Promise<boolean> => {
  const [ab, ba] = await Promise.all([isBlocked(a, b), isBlocked(b, a)]);
  return ab || ba;
};
