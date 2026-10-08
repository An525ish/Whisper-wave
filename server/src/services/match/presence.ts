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
 * The /anon namespace the sweeper notifies through, and its single pending timer.
 *
 * The sweeper only runs while the `presenceSweeps` sorted set is non-empty. It is
 * armed by the first drop (or at boot, to pick up entries a previous process left
 * behind) and stops itself when it finds the set empty. It sleeps until the
 * earliest deadline rather than polling on an interval: Upstash bills per command,
 * so an always-on 5 s poll costs ~17k commands/day for nothing.
 */
let sweepNamespace: Namespace | null = null;
let sweepTimer: ReturnType<typeof setTimeout> | null = null;
let sweepStopped = false;

/** Epoch ms at which a drop taken now stops being a reconnect and starts a teardown. */
const graceDeadline = (): number =>
  Date.now() + (TTL.presence + PRESENCE_SWEEP.graceOverheadSeconds) * 1000;

/** Does this anonId still have a live /anon socket (other than `exceptSocketId`)? */
const hasLiveSocket = async (
  nsp: Namespace,
  anonId: string,
  exceptSocketId?: string
): Promise<boolean> => {
  const sockets = await nsp.in(`anon:${anonId}`).fetchSockets();
  return sockets.some((socket) => socket.id !== exceptSocketId);
};

/**
 * Put a claimed-but-unprocessed drop back on the schedule.
 *
 * `ZREM` is the claim, so a sweep that claims an entry and then hits a Redis error
 * would otherwise lose the teardown forever — the partner would sit in a dead
 * thread. Re-adding the deadline makes the failure a retry instead.
 */
const rescheduleDrop = async (anonId: string): Promise<void> => {
  try {
    await getRedis().zadd(
      REDIS_KEYS.presenceSweeps,
      Date.now() + PRESENCE_SWEEP.intervalMs,
      anonId
    );
  } catch (err) {
    logger.error({ err, anonId }, 'Failed to reschedule a presence sweep — teardown lost');
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

  // No presence-key check here. The claim (`ZREM`) already proves nobody came
  // back: a reconnect runs `clearPresence`, which removes the entry before any
  // sweep can claim it. (The key itself has expired by now — its TTL is shorter
  // than the sweep deadline by design — so "key absent" says nothing.)
  //
  // What a claim cannot see is a socket that connected AFTER the claim but whose
  // `clearPresence` has not landed yet, or a second tab: ask the namespace. Every
  // failure below happens after the entry was claimed, so each one puts it back
  // on the schedule instead of losing the teardown.
  let live: boolean;
  try {
    live = await hasLiveSocket(nsp, droppedAnonId);
  } catch (err) {
    logger.warn({ err, anonId: droppedAnonId }, 'Live-socket check failed — will retry teardown');
    await rescheduleDrop(droppedAnonId);
    return;
  }
  if (live) return; // still here — clear nothing

  let session: AnonSession | null;
  try {
    session = await getSession(sessionId);
  } catch (err) {
    logger.warn({ err, sessionId }, 'Failed to read dropped session — will retry teardown');
    await rescheduleDrop(droppedAnonId);
    return;
  }
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
 *
 * Returns how long to sleep before looking again, or `null` when the set is empty
 * and the sweeper should stop. Throws on a Redis failure reading the set (the
 * caller retries on `intervalMs`).
 */
const sweepLapsedDrops = async (nsp: Namespace): Promise<number | null> => {
  const redis = getRedis();

  // Earliest entry: [member, score] or [] — one command tells us both "is the set
  // empty" and "when is the next deadline".
  const head = await redis.zrange(REDIS_KEYS.presenceSweeps, 0, 0, 'WITHSCORES');
  if (head.length === 0) return null;

  const dueAt = Number(head[1]);
  const now = Date.now();
  if (dueAt > now) {
    return Math.min(Math.max(dueAt - now, 250), PRESENCE_SWEEP.maxSleepMs);
  }

  const due = await redis.zrangebyscore(
    REDIS_KEYS.presenceSweeps,
    '-inf',
    now,
    'LIMIT',
    0,
    PRESENCE_SWEEP.batchSize
  );

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
    let sessionId: string | null;
    try {
      sessionId = await getActiveSessionId(anonId);
    } catch (err) {
      logger.warn({ err, anonId }, 'Failed to resolve session for lapsed sweep — will retry');
      await rescheduleDrop(anonId);
      continue;
    }
    if (!sessionId) continue;

    await finalizeDrop(nsp, sessionId, anonId).catch((err: unknown) => {
      logger.warn({ err, anonId, sessionId }, 'Presence sweep failed — will retry');
      return rescheduleDrop(anonId);
    });
  }

  return PRESENCE_SWEEP.intervalMs;
};

const scheduleSweep = (nsp: Namespace, delayMs: number): void => {
  if (sweepStopped || sweepTimer) return;
  sweepNamespace = nsp;
  sweepTimer = setTimeout(() => {
    sweepTimer = null;
    const namespace = sweepNamespace;
    if (!namespace || sweepStopped) return;
    void sweepLapsedDrops(namespace)
      .then((next) => {
        if (next !== null) scheduleSweep(namespace, next);
      })
      .catch((err: unknown) => {
        logger.warn({ err }, 'Presence sweep poll failed — retrying');
        scheduleSweep(namespace, PRESENCE_SWEEP.intervalMs);
      });
  }, delayMs);
  sweepTimer.unref?.();
};

/**
 * Arm the sweeper. Called at boot — so grace periods a previous process left in
 * Redis are still honoured after a restart — and on every drop. A no-op while a
 * timer is already pending; the sweeper stops by itself when nothing is left.
 */
export const startPresenceSweeper = (nsp: Namespace, delayMs = 1_000): void => {
  scheduleSweep(nsp, delayMs);
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
 *
 * A drop is ignored entirely when the same anonId still has ANOTHER live socket
 * (a second tab, or a reconnect that overtook this disconnect): tearing down or
 * dequeuing then would end the match of someone who is plainly still here.
 */
export const handleSocketDrop = async (
  nsp: Namespace,
  anonId: string,
  sessionId: string | undefined,
  socketId: string
): Promise<void> => {
  try {
    const stillHere = await hasLiveSocket(nsp, anonId, socketId).catch((err: unknown) => {
      // Cannot tell — fall through to the grace period, which a live socket cancels
      // by itself; the alternative (skipping) could leave a real drop unswept.
      logger.warn({ err, anonId }, 'Live-socket check failed on drop');
      return false;
    });
    if (stillHere) return;

    // Always dequeue: a queued user who dropped is genuinely gone from the queue.
    await dequeue(anonId);

    if (!sessionId) return;

    // Presence key and sweep deadline in one round-trip. If Redis is unhappy the
    // grace period simply never fires, which is the same place the old code
    // landed: `finalizeDrop` would have bailed out on its own presence check.
    const pipe = getRedis().pipeline();
    pipe.set(REDIS_KEYS.presence(anonId), sessionId, 'EX', TTL.presence);
    pipe.zadd(REDIS_KEYS.presenceSweeps, graceDeadline(), anonId);
    await pipe.exec();

    startPresenceSweeper(nsp, graceDeadline() - Date.now());

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
 * Shutdown helper — stop the presence-sweep timer for good.
 *
 * Pending grace periods are deliberately NOT flushed. They live in Redis, so
 * whichever process boots next picks them up — which is the entire reason they
 * were moved out of process memory.
 */
export const stopAllPresenceSweeps = (): void => {
  sweepStopped = true;
  if (sweepTimer) clearTimeout(sweepTimer);
  sweepTimer = null;
  sweepNamespace = null;
};
