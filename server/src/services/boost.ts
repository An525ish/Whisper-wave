import { getRedis } from '../config/redis.js';
import { BOOST_MS } from '../constants/plans.js';
import * as boostRepo from '../repositories/boostWallet.js';
import type { Entitlements } from '../types/subscription.js';
import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import { getEntitlements } from './user/entitlements.js';
import { REDIS_KEYS } from './match/keys.js';

/**
 * Spend one boost credit. For the next 30 minutes (stacking if one is running) this
 * account's waiting card ranks first among otherwise acceptable matches.
 *
 * Mongo owns the credit and the end time; Redis holds a self-expiring key the matcher
 * can check cheaply. If Redis is down we put the credit back and say so, so nobody
 * pays for a boost that does nothing. Ponytail: a Redis flush ends a boost early (the
 * wallet still says active); the ceiling is 30 minutes of lost boost, upgrade path is
 * re-arming the key from the wallet on read.
 */
export const activateBoost = async (userId: string): Promise<Entitlements> => {
  const now = new Date();
  const before = await boostRepo.spendOne(userId, BOOST_MS, now);
  if (!before) throw new AppError(409, 'You have no boosts left');

  const base = Math.max(before.activeUntil?.getTime() ?? 0, now.getTime());
  try {
    await getRedis().set(REDIS_KEYS.boost(userId), '1', 'PXAT', base + BOOST_MS);
  } catch (err) {
    logger.error({ err, userId }, 'Could not arm boost: refunding the credit');
    await boostRepo.refund(userId, before.activeUntil ?? null).catch((e: unknown) =>
      logger.error({ e, userId }, 'Could not refund a boost credit: fix by hand')
    );
    throw new AppError(503, "Boost isn't available right now. You were not charged a boost.");
  }
  return getEntitlements(userId);
};

/** Of these accounts, which have a running boost? One round trip. Fails open to "none". */
export const boostedUsers = async (userIds: readonly string[]): Promise<Set<string>> => {
  const ids = [...new Set(userIds)];
  if (ids.length === 0) return new Set();
  try {
    const pipe = getRedis().pipeline();
    ids.forEach((id) => pipe.exists(REDIS_KEYS.boost(id)));
    const res = await pipe.exec();
    return new Set(ids.filter((_, i) => res?.[i]?.[1] === 1));
  } catch (err) {
    logger.warn({ err }, 'Boost lookup failed: matching without boosts');
    return new Set();
  }
};
