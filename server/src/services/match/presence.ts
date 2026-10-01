import { getRedis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import type { Namespace } from 'socket.io';
import type { AnonSession } from '../../types/match.js';
import { MATCH_DISCONNECTED } from '../../constants/anon-events.js';
import { REDIS_KEYS, TTL } from './keys.js';
import { dequeue } from './queue.js';
import { endSession, getPartner, getSession } from './session.js';

/**
 * Disconnect handling for the /anon namespace.
 *
 * A dropped socket is NOT proof that the person left. Mobile networks tunnel,
 * tabs get evicted, laptops sleep. Ending the match immediately meant a 2-second
 * blip destroyed the conversation for BOTH people and — because the identity card
 * was being deleted at match time — left the reconnecting user with no route back
 * into the queue (an infinite spinner).
 *
 * So a drop now starts a short grace period instead:
 *   1. On connect, clear presence immediately (we're back).
 *   2. On drop, set `match:presence:{anonId}` with a TTL.
 *   3. A sweeper ends the session only if presence is still set when it lapses.
 *   4. Waiting users are still dequeued right away — nothing to resume there.
 */

const sweepTimers = new Map<string, ReturnType<typeof setTimeout>>();

/** Mark an anonId as connected again: cancel any pending grace period. */
export const clearPresence = async (anonId: string): Promise<void> => {
  const timer = sweepTimers.get(anonId);
  if (timer) {
    clearTimeout(timer);
    sweepTimers.delete(anonId);
  }
  try {
    await getRedis().del(REDIS_KEYS.presence(anonId));
  } catch (err) {
    logger.warn({ err, anonId }, 'Failed to clear presence on reconnect');
  }
};

/**
 * Tear the match down once the grace period lapses with nobody back.
 *
 * Idempotent: the `presenceNotified` key (SET NX) guarantees the partner is
 * told exactly once even if several sweep paths race.
 */
const finalizeDrop = async (
  nsp: Namespace,
  sessionId: string,
  droppedAnonId: string
): Promise<void> => {
  const redis = getRedis();

  // Someone reconnected inside the grace window — leave the match alone.
  const stillAbsent = await redis
    .exists(REDIS_KEYS.presence(droppedAnonId))
    .catch((err: unknown) => {
      logger.warn({ err, anonId: droppedAnonId }, 'Presence check failed — skipping teardown');
      return 0;
    });
  if (stillAbsent === 0) return;

  await redis.del(REDIS_KEYS.presence(droppedAnonId)).catch((err: unknown) =>
    logger.warn({ err, anonId: droppedAnonId }, 'Failed to clear presence key on teardown')
  );

  const session = await getSession(sessionId).catch((err: unknown) => {
    logger.warn({ err, sessionId }, 'Failed to read dropped session');
    return null;
  });
  if (!session) return;
  if (session.anon1 !== droppedAnonId && session.anon2 !== droppedAnonId) return;

  const firstNotice = await redis
    .set(REDIS_KEYS.presenceNotified(sessionId), '1', 'EX', 300, 'NX')
    .catch((err: unknown) => {
      logger.warn({ err, sessionId }, 'Failed to claim presence notice');
      return null;
    });

  await endSession(sessionId).catch((err: unknown) =>
    logger.warn({ err, sessionId }, 'Failed to end dropped session')
  );

  if (firstNotice === 'OK') {
    nsp.to(`anon:${getPartner(session, droppedAnonId)}`).emit(MATCH_DISCONNECTED, {
      reason: 'disconnected',
    });
    logger.info({ sessionId, droppedAnonId }, 'Presence grace lapsed — match ended');
  }
};

/**
 * Called on socket `disconnect`.
 * Waiting users are dequeued immediately; matched users get a grace period.
 */
export const handleSocketDrop = async (
  nsp: Namespace,
  anonId: string,
  sessionId: string | undefined
): Promise<void> => {
  try {
    // Always dequeue: a queued user who dropped is genuinely gone from the queue.
    await dequeue(anonId);

    if (!sessionId) return;

    await getRedis()
      .set(REDIS_KEYS.presence(anonId), sessionId, 'EX', TTL.presence)
      .catch((err: unknown) =>
        logger.warn({ err, anonId }, 'Failed to set disconnect presence')
      );

    const existing = sweepTimers.get(anonId);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      sweepTimers.delete(anonId);
      void finalizeDrop(nsp, sessionId, anonId).catch((err: unknown) =>
        logger.warn({ err, anonId, sessionId }, 'Presence sweep failed')
      );
    }, (TTL.presence + 2) * 1000);
    timer.unref?.();
    sweepTimers.set(anonId, timer);

    logger.info({ anonId, sessionId }, 'Anon socket dropped — grace period started');
  } catch (err) {
    logger.warn({ err, anonId }, 'handleSocketDrop failed');
  }
};

/**
 * Immediate teardown for an explicit ANON_NEXT (skip) — no grace period, the
 * user clearly meant it. Returns the partner's anonId so the caller can notify.
 */
export const endSessionNow = async (
  session: AnonSession,
  skippedAnonId: string
): Promise<string> => {
  const partnerAnonId = getPartner(session, skippedAnonId);
  await clearPresence(skippedAnonId);
  await endSession(session.sessionId).catch((err: unknown) =>
    logger.warn({ err, sessionId: session.sessionId }, 'Failed to end skipped session')
  );
  return partnerAnonId;
};

/** Shutdown helper — stop every pending grace-period timer. */
export const stopAllPresenceSweeps = (): void => {
  for (const timer of sweepTimers.values()) clearTimeout(timer);
  sweepTimers.clear();
};
