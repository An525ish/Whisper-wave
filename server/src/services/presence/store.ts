import { getRedis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import { PRESENCE_KEYS, PRESENCE_TTL } from '../match/keys.js';

/**
 * Redis-backed presence store for the signed-in app.
 *
 * `presence:sockets:{userId}` → SET of socketIds is the cluster-shared record of
 * who is online. Every process writes through here, which is what lifts presence
 * off a single-process `Map` (A3 in docs/Todo.md).
 *
 * Reads deliberately do NOT come from here — see `index.ts`. Fan-out has to stay
 * synchronous (its call sites are) and has to be able to address the sockets it
 * reads, which only this process owns. This store is the record; `index.ts` keeps
 * the addressing registry.
 *
 * Every failure here is non-fatal and logged, mirroring `match/queue.ts`: a Redis
 * blip must not stop someone connecting, messaging or disconnecting.
 */

/**
 * Record one socket for a user.
 *
 * SADD + EXPIRE share a pipeline so a connect costs one round-trip, not two.
 */
export const recordUserSocket = async (
  userId: string,
  socketId: string
): Promise<void> => {
  try {
    const pipe = getRedis().pipeline();
    pipe.sadd(PRESENCE_KEYS.userSockets(userId), socketId);
    pipe.expire(PRESENCE_KEYS.userSockets(userId), PRESENCE_TTL.userSockets);
    await pipe.exec();
  } catch (err) {
    logger.warn({ err, userId, socketId }, 'Failed to record user socket in Redis');
  }
};

/**
 * Forget one socket for a user.
 *
 * Only ever SREM — never DEL. A user's other tabs may be attached to a different
 * instance, so "this process holds no more sockets for them" is not proof the
 * Redis set is empty, and deleting it would erase a genuinely online user.
 */
export const forgetUserSocket = async (
  userId: string,
  socketId: string
): Promise<void> => {
  try {
    const pipe = getRedis().pipeline();
    pipe.srem(PRESENCE_KEYS.userSockets(userId), socketId);
    pipe.expire(PRESENCE_KEYS.userSockets(userId), PRESENCE_TTL.userSockets);
    await pipe.exec();
  } catch (err) {
    logger.warn({ err, userId, socketId }, 'Failed to forget user socket in Redis');
  }
};