import { getRedis } from '../../config/redis.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import type { WhisperQuota } from '../../types/match.js';
import { REDIS_KEYS, TTL } from './keys.js';

/**
 * Rolling 24-hour whisper cap for SIGNED-IN users.
 *
 * Guests are never capped. They are the top of the funnel — a wall in front of
 * them buys nothing and costs the funnel. This is an abuse lever, not a paywall:
 * it caps the cost a single account can impose on the match scan, and there is
 * no billing anywhere in this repo to gate anything paid against.
 *
 * Rolling window, not a midnight reset
 * ------------------------------------
 * A date-stamped key would mean every account's window closes at the same
 * instant, and that instant is the join scan — the most expensive moment in the
 * system. Instead the window opens on the account's own first attempt and slides
 * from there, so the load is staggered by construction: at 09:00 the accounts
 * opening a window are the ones whose 24 h have actually elapsed.
 *
 * Cost is one `INCR` per attempt, plus one `EXPIRE` when the window opens. That
 * is deliberately not folded into `tryMatchFromQueue`: it runs once per join
 * attempt, off the scan, and adding it there would make the scan's bounded cost
 * depend on a second key.
 *
 * Note the TTL is set on the *first* increment only. Refreshing it on every
 * attempt would be a sliding window that never closes: 30 whispers spread over a
 * week would still be 30, so the account would be capped for good. A window that
 * only opens on attempt one and expires 24 h later is a real rolling window.
 */

/**
 * Whispers per rolling day, for signed-in accounts only.
 *
 * 30 is chosen so a genuinely casual user never touches it: someone who opens
 * Whisper twenty times a day is a power user by any honest reading, and the cap
 * should engage on automation rather than enthusiasm. Generous enough to be
 * invisible, low enough that one account cannot hold the queue in a spin loop.
 */
export const DAILY_WHISPER_LIMIT = 30;

/**
 * Record one attempt and open the window on the first one — in one round-trip.
 *
 * Atomic rather than `INCR` + `EXPIRE` in a pipeline, because a pipeline is not
 * a transaction here: two attempts landing at once could both read "first" or
 * neither, and the loser of that race is left with a counter and no expiry —
 * an account permanently locked out of Whisper. The script has no interleaving
 * point, so exactly one caller sets the TTL.
 */
const CONSUME_SCRIPT = `
  local n = redis.call('INCR', KEYS[1])
  if n == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  return n
`;

/**
 * The same, but only for a FRESH join: if the anonId already holds a
 * `joinCounted` marker (a refresh, a flaky-network reconnect, a second tab inside
 * the window) it is the same whisper and nothing is counted (`-1`).
 *
 * The marker is only set while the account is still UNDER the cap. A refused
 * attempt must keep counting, otherwise "retry until under" is the cheapest way
 * around the cap.
 */
const FRESH_JOIN_SCRIPT = `
  if redis.call('EXISTS', KEYS[2]) == 1 then
    return -1
  end
  local n = redis.call('INCR', KEYS[1])
  if n == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
  end
  if n <= tonumber(ARGV[2]) then
    redis.call('SET', KEYS[2], '1', 'EX', ARGV[3])
  end
  return n
`;

/** Read the current count without recording an attempt. */
export const peekWhisperQuota = async (userId: string): Promise<WhisperQuota> => {
  const used = await getRedis().get(REDIS_KEYS.userWhispers(userId));
  return { used: Number(used ?? 0), limit: DAILY_WHISPER_LIMIT, counted: false };
};

/** Forget the "this join was already counted" marker — a new picker submit is a new whisper. */
export const clearJoinCounted = async (anonId: string): Promise<void> => {
  await getRedis().del(REDIS_KEYS.joinCounted(anonId));
};

/** Never-throwing adapter: the socket layer emits the returned `AppError`, it holds no rule. */
const asResult = async (
  run: () => Promise<WhisperQuota>
): Promise<WhisperQuota | AppError> => {
  try {
    return await run();
  } catch (err) {
    // `consumeWhisperQuota` already converts its own failures to `AppError`, so
    // this only guards a future change — but a raw Redis error escaping here
    // would disconnect the socket instead of telling the user why.
    return err instanceof AppError
      ? err
      : new AppError(503, 'Could not check your whisper limit — try again in a moment');
  }
};

/**
 * Enforce the cap for a socket that is about to enter the queue from a connect.
 *
 * Counts only FRESH joins: a refresh while queued, a reconnect after a network
 * blip and a second tab are the same whisper and are not counted (see
 * `FRESH_JOIN_SCRIPT`). Resumed matches never get here at all. Guests are not
 * counted and never refused.
 *
 * Returns the quota when the user may proceed, or the `AppError` to surface
 * instead of queueing them — the caller emits it, so the socket layer holds no
 * business rule.
 */
export const checkWhisperQuota = async (
  userId: string | undefined,
  anonId: string
): Promise<WhisperQuota | AppError> => {
  if (!userId) return { used: 0, limit: DAILY_WHISPER_LIMIT, counted: false };
  return asResult(() => consumeFreshJoin(userId, anonId));
};

/**
 * Enforce the cap for an explicit skip (`ANON_NEXT`). A skip IS a new whisper, so
 * it always counts — it is never deduplicated against the join marker.
 */
export const checkSkipQuota = async (
  userId: string | undefined
): Promise<WhisperQuota | AppError> => {
  if (!userId) return { used: 0, limit: DAILY_WHISPER_LIMIT, counted: false };
  return asResult(() => consumeWhisperQuota(userId));
};

const consumeFreshJoin = async (userId: string, anonId: string): Promise<WhisperQuota> => {
  let used: number;
  try {
    used = Number(
      await getRedis().eval(
        FRESH_JOIN_SCRIPT,
        2,
        REDIS_KEYS.userWhispers(userId),
        REDIS_KEYS.joinCounted(anonId),
        String(TTL.whisperWindow),
        String(DAILY_WHISPER_LIMIT),
        String(TTL.joinCounted)
      )
    );
  } catch (err) {
    logger.error({ err, userId }, 'Failed to record whisper quota attempt');
    throw new AppError(503, 'Could not check your whisper limit — try again in a moment');
  }
  if (!Number.isFinite(used)) {
    throw new AppError(503, 'Could not check your whisper limit — try again in a moment');
  }
  if (used === -1) return { used: 0, limit: DAILY_WHISPER_LIMIT, counted: false };
  return enforceLimit(used);
};

const enforceLimit = (used: number): WhisperQuota => {
  if (used > DAILY_WHISPER_LIMIT) {
    throw new AppError(
      429,
      `You have used all ${DAILY_WHISPER_LIMIT} whispers for today. Come back in a few hours.`
    );
  }
  return { used, limit: DAILY_WHISPER_LIMIT, counted: true };
};

/**
 * Record one join attempt against a signed-in account and enforce the cap.
 *
 * Guests are not counted and are never refused, so the caller simply doesn't
 * invoke this without a userId.
 *
 * Counts the attempt even when it is refused. A caller that keeps retrying has to
 * stay over the line, otherwise "try until you're under" is the cheapest way
 * around the cap.
 *
 * Throws `AppError(429)` when the cap is hit. The message is what the user
 * reads, so it says what happened and when it lifts rather than stating a rule.
 */
export const consumeWhisperQuota = async (userId: string): Promise<WhisperQuota> => {
  const key = REDIS_KEYS.userWhispers(userId);

  let used: number;
  try {
    used = Number(await getRedis().eval(CONSUME_SCRIPT, 1, key, String(TTL.whisperWindow)));
  } catch (err) {
    // We could not record the attempt. Refusing here would lock a legitimate user
    // out of Whisper because Redis is unhappy; allowing it makes the cap soft
    // exactly when the system is already degraded — which is the right way round
    // for an abuse lever.
    logger.error({ err, userId }, 'Failed to record whisper quota attempt');
    throw new AppError(503, 'Could not check your whisper limit — try again in a moment');
  }

  // A non-numeric result would compare as `NaN > limit === false` and silently
  // wave the attempt through, so treat it as "we could not count it".
  if (!Number.isFinite(used)) {
    throw new AppError(503, 'Could not check your whisper limit — try again in a moment');
  }

  return enforceLimit(used);
};
