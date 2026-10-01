import { getRedis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
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

/**
 * Which of `candidates` must not be matched with `a`, checking the block
 * relationship in both directions.
 *
 * Two `SISMEMBER`s per candidate, all in a single pipeline, so checking N
 * candidates costs one round-trip rather than the 2N sequential calls. Join
 * attempts run this over every waiting user, so the difference is the whole
 * scan — this is the check that made matching O(queue length).
 */
export const findBlockedCandidates = async (
  a: string,
  candidates: string[]
): Promise<Set<string>> => {
  const blocked = new Set<string>();
  if (candidates.length === 0) return blocked;

  const pipe = getRedis().pipeline();
  for (const candidate of candidates) {
    // Fixed order — forward then reverse — so results zip back by index.
    pipe.sismember(REDIS_KEYS.blocked(a), candidate);
    pipe.sismember(REDIS_KEYS.blocked(candidate), a);
  }
  const results = await pipe.exec();

  candidates.forEach((candidate, i) => {
    const forward = results?.[i * 2];
    const reverse = results?.[i * 2 + 1];

    if (forward?.[0] || reverse?.[0]) {
      // A command-level error means we cannot prove this pair is clean.
      // Drop the candidate rather than risk matching a blocked pair — a lost
      // match is recoverable, an ignored block is not.
      logger.warn(
        { anonId: a, candidate },
        'Block check failed — excluding candidate from this attempt'
      );
      blocked.add(candidate);
      return;
    }

    if (forward?.[1] === 1 || reverse?.[1] === 1) blocked.add(candidate);
  });

  return blocked;
};
