import { getRedis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import type { Namespace } from 'socket.io';
import type { AnonSession } from '../../types/match.js';
import { MATCH_DISCONNECTED } from '../../constants/anon-events.js';
import { PRESENCE_SWEEP, REDIS_KEYS, TTL } from './keys.js';
import { dequeue } from './queue.js';
import { endSession, getActiveSessionId, getPartner, getSession } from './session.js';

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
 *   2. On drop, set `match:presence:{anonId}` with a TTL and record a deadline in
 *      the `match:presence-sweeps` sorted set.
 *   3. A poller ends the session only if presence is still set when it lapses.
 *   4. Waiting users are still dequeued right away — nothing to resume there.
 *
 * The deadline is durable state in Redis, not a `Map<anonId, Timeout>` held per
 * process (A4 in docs/Todo.md). A `setTimeout` only exists in the process that
 * created it, so a drop on one instance was swept by that instance and nobody
 * else: restart it, redeploy it, or run two of them, and the match was never torn
 * down at all — the partner sat in front of a dead thread indefinitely. A sorted
 * set is claimable by any process and survives a restart.
 */

/**
 * The /anon namespace, and the poll interval that drives the sweeper.
 *
 * `handleSocketDrop` is the only thing that hands us a namespace and it does so
 * on every drop, so the namespace is captured the first time one happens rather
 * than at boot. A process that has never seen an anon drop never starts the
 * poller — which is right, because it has no anon sockets to notify.
 */
let sweepNamespace: Namespace | null = null;
let sweepTimer: ReturnType<typeof setInterval> | null = null;
let sweepInFlight = false;

/** Epoch ms at which a drop taken now stops being a reconnect and starts a teardown. */
const graceDeadline = (): number =>
  Date.now() + (TTL.presence + PRESENCE_SWEEP.graceOverheadSeconds) * 1000;

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
 * Claim and run every grace period that has lapsed.
 *
 * `ZREM` *is* the claim — it removes the member atomically, so when N processes
 * poll the same sorted set exactly one wins each sweep. No lock, no fencing
 * token, no process handed the same work twice. Everything the sweep then reads
 * (presence key, session, partner) is already in Redis, so the teardown itself is
 * process-independent.
 */
const sweepLapsedDrops = async (nsp: Namespace): Promise<void> => {
  const redis = getRedis();

  const due = await redis
    .zrangebyscore(
      REDIS_KEYS.presenceSweeps,
      '-inf',
      Date.now(),
      'LIMIT',
      0,
      PRESENCE_SWEEP.batchSize
    )
    .catch((err: unknown) => {
      logger.warn({ err }, 'Failed to read due presence sweeps');
      return [] as string[];
    });

  for (const anonId of due) {
    const claimed = await redis.zrem(REDIS_KEYS.presenceSweeps, anonId).catch(
      (err: unknown) => {
        logger.warn({ err, anonId }, 'Failed to claim presence sweep');
        return 0;
      }
    );
    if (claimed !== 1) continue; // another process claimed it first

    // The deadline is keyed by anonId, so the session is resolved here rather than
    // carried in the entry. If it was replaced in the meantime `finalizeDrop`'s
    // participation check turns this into a no-op instead of a wrong teardown.
    const sessionId = await getActiveSessionId(anonId).catch((err: unknown) => {
      logger.warn({ err, anonId }, 'Failed to resolve session for lapsed sweep');
      return null;
    });
    if (!sessionId) continue;

    await finalizeDrop(nsp, sessionId, anonId).catch((err: unknown) =>
      logger.warn({ err, anonId, sessionId }, 'Presence sweep failed')
    );
  }
};

const ensureSweeperRunning = (nsp: Namespace): void => {
  sweepNamespace = nsp;
  if (sweepTimer) return;

  sweepTimer = setInterval(() => {
    const namespace = sweepNamespace;
    if (!namespace || sweepInFlight) return;
    sweepInFlight = true;
    void sweepLapsedDrops(namespace)
      .catch((err: unknown) => logger.warn({ err }, 'Presence sweep poll failed'))
      .finally(() => {
        sweepInFlight = false;
      });
  }, PRESENCE_SWEEP.intervalMs);
  sweepTimer.unref?.();
};

/**
 * Mark an anonId as connected again: cancel any pending grace period.
 *
 * The pending sweep is a member of the sorted set keyed by anonId, so cancelling
 * is an exact `ZREM`, and both keys drop in one pipeline instead of two
 * round-trips.
 */
export const clearPresence = async (anonId: string): Promise<void> => {
  try {
    const pipe = getRedis().pipeline();
    pipe.del(REDIS_KEYS.presence(anonId));
    pipe.zrem(REDIS_KEYS.presenceSweeps, anonId);
    await pipe.exec();
  } catch (err) {
    logger.warn({ err, anonId }, 'Failed to clear presence on reconnect');
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

    ensureSweeperRunning(nsp);

    // Presence key and sweep deadline in one round-trip. If Redis is unhappy the
    // grace period simply never fires, which is the same place the old code
    // landed: `finalizeDrop` would have bailed out on its own presence check.
    const pipe = getRedis().pipeline();
    pipe.set(REDIS_KEYS.presence(anonId), sessionId, 'EX', TTL.presence);
    pipe.zadd(REDIS_KEYS.presenceSweeps, graceDeadline(), anonId);
    await pipe.exec();

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

/**
 * Shutdown helper — stop the presence-sweep poller.
 *
 * Pending grace periods are deliberately NOT flushed. They live in Redis, so
 * whichever process boots next picks them up — which is the entire reason they
 * were moved out of process memory.
 */
export const stopAllPresenceSweeps = (): void => {
  if (sweepTimer) clearInterval(sweepTimer);
  sweepTimer = null;
  sweepNamespace = null;
};