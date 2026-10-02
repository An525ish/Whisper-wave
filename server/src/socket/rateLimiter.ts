import { randomBytes } from 'node:crypto';
import { getRedis } from '../config/redis.js';
import { logger } from '../utils/logger.js';

export type SocketRateLimiter = {
  allow(socketId: string): Promise<boolean>;
  remove(socketId: string): Promise<void>;
};

/**
 * Redis key for one limiter × one socket.
 *
 * Kept here, not in `services/match/keys.ts`, on purpose. That file states that
 * `REDIS_KEYS` is uniformly `match:`-namespaced and worth keeping that way, and
 * a socket rate limit is not a match key — the signed-in chat would need the same
 * builder and has nothing to do with matchmaking. Reaching into a feature folder
 * for a cross-feature concern would couple `socket/` to `match/`, and the socket
 * layer is supposed to know nothing about it.
 *
 * `namespace` is load-bearing, not decoration. One socket carries several
 * limiters (message, like, requeue, reaction); sharing one key between them
 * would mean the message allowance laundered the reaction allowance, since the
 * buckets are the same counters.
 */
export const socketLimiterKey = (namespace: string, socketId: string): string =>
  `socket:rl:${namespace}:${socketId}`;

/**
 * Sorted-set member for one recorded event.
 *
 * The timestamp alone is not a member: two events admitted in the same
 * millisecond would score identically, and `ZADD` updates an existing member
 * rather than adding one — so a scripted client firing a hundred events inside
 * a single millisecond would be counted as one and sail past the cap. The
 * process tag keeps entries from different instances apart, and the counter
 * keeps entries inside this instance apart.
 */
const PROCESS_TAG = randomBytes(4).toString('hex');
let sequence = 0;
const nextMember = (now: number): string => {
  sequence += 1;
  return `${now}-${PROCESS_TAG}-${sequence}`;
};

/**
 * Sliding-window admit, as one atomic step.
 *
 * `ZREMRANGEBYSCORE` drops everything at or before the window edge, `ZCARD`
 * counts what is left, and `ZADD` records this event if there is room. As three
 * round trips that is a race: two concurrent events can both read a count below
 * the cap and both be admitted, which is exactly the burst the limiter exists to
 * stop. Inside one script there is no interleaving point.
 *
 * Sliding, not fixed, on purpose. A fixed window hands out a second full
 * allowance at every boundary, so `maxEvents` at the end of one window plus
 * `maxEvents` at the start of the next is double the intended rate — and the
 * author of a flood does not have to be clever, just unlucky with the clock.
 *
 * The trim matches the in-process filter exactly (`t > cutoff`), so both
 * implementations age out on the same schedule.
 *
 * The clock is the caller's, passed in as an argument, because `TIME` inside a
 * script is non-deterministic and its availability depends on the Redis build.
 * Skew between instances of a few hundred milliseconds is immaterial against a
 * 10–30 s window; a fixed window keyed to a single server's clock would not be.
 */
const SLIDING_WINDOW_SCRIPT = `
  local maxEvents = tonumber(ARGV[1])
  local windowMs = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local member = ARGV[4]

  redis.call('ZREMRANGEBYSCORE', KEYS[1], '-inf', now - windowMs)
  local used = redis.call('ZCARD', KEYS[1])

  local allowed = 0
  if used < maxEvents then
    redis.call('ZADD', KEYS[1], now, member)
    allowed = 1
  end

  -- One window past the last event this key saw, admitted or not. Written after
  -- the ZADD on purpose: PEXPIRE on a key that does not exist yet is a no-op, so
  -- ordering it first would leave the very first event with no expiry and the
  -- key would live until the process restarted.
  redis.call('PEXPIRE', KEYS[1], windowMs)
  return allowed
`;

/**
 * Sliding-window limiter shared across every Node process.
 *
 * Redis rather than a `Map` for two reasons. An in-process `Map` is only freed by
 * `disconnect` firing, so a crash mid-session strands one entry per socket for
 * the life of the process — TTLs here reclaim them. And the cap is then a fact
 * about the cluster instead of a fact about one process.
 *
 * `namespace` separates the buckets a single socket carries. There is no default:
 * a shared bucket across limiters is a silent hole, and a required argument is
 * the only way to make someone choose the name.
 */
export const makeRedisSocketRateLimiter = (
  namespace: string,
  maxEvents: number,
  windowMs: number
): SocketRateLimiter => ({
  /**
   * Record one event and report whether it was within budget.
   *
   * Fails OPEN. A rate limiter that refuses when it cannot answer turns a Redis
   * blip into a total outage of the surface it guards — anyone who can make
   * Redis unhappy could then stop messages, likes and requeues entirely. A soft
   * cap during a degraded second is the right way round for an abuse lever, and
   * this is the same call `consumeWhisperQuota` makes for the same reason.
   */
  async allow(socketId: string): Promise<boolean> {
    const now = Date.now();
    try {
      const admitted = Number(
        await getRedis().eval(
          SLIDING_WINDOW_SCRIPT,
          1,
          socketLimiterKey(namespace, socketId),
          String(maxEvents),
          String(windowMs),
          String(now),
          nextMember(now)
        )
      );
      // A non-numeric reply would compare false against both branches and drop
      // every event silently, so treat "no answer" the same as a Redis failure.
      if (!Number.isFinite(admitted)) {
        logger.warn({ namespace, socketId }, 'Socket rate limiter returned no verdict');
        return true;
      }
      return admitted === 1;
    } catch (err) {
      logger.warn({ err, namespace, socketId }, 'Socket rate limiter unavailable — allowing');
      return true;
    }
  },

  /**
   * Drop the socket's state entirely.
   *
   * Never rejects. Callers are disconnect handlers, which are fire-and-forget,
   * so a rejected promise here would be an unhandled rejection and take the
   * process down on the way out. The state is only a cap, so a failure to clear
   * it costs at most one stale window, which the TTL collects anyway.
   */
  async remove(socketId: string): Promise<void> {
    try {
      await getRedis().del(socketLimiterKey(namespace, socketId));
    } catch (err) {
      logger.warn({ err, namespace, socketId }, 'Failed to clear socket rate limit state');
    }
  },
});

/**
 * In-process sliding window, one `Map` per limiter.
 *
 * Correct for anything keyed by `socketId`: a socket is held by exactly one
 * process for its whole life, so every connection gets the real cap no matter how
 * many instances are running. What it cannot do is expire its own memory — only
 * `disconnect` frees an entry — so it suits a surface where a missed disconnect
 * is rare.
 *
 * For an unauthenticated namespace that can be scripted from anywhere, use
 * `makeRedisSocketRateLimiter` instead.
 */
export const makeSocketRateLimiter = (
  maxEvents: number,
  windowMs: number
): SocketRateLimiter => {
  const timestamps = new Map<string, number[]>();
  return {
    async allow(socketId: string): Promise<boolean> {
      const now = Date.now();
      const cutoff = now - windowMs;
      const times = (timestamps.get(socketId) ?? []).filter((t) => t > cutoff);
      if (times.length >= maxEvents) return false;
      times.push(now);
      timestamps.set(socketId, times);
      return true;
    },
    async remove(socketId: string): Promise<void> {
      timestamps.delete(socketId);
    },
  };
};

// 30 messages / 10 s per socket — generous for normal use, stops floods.
//
// Stays in-process: this is the signed-in chat, behind an account and a token,
// and a socketId-keyed cap is per-connection anyway (see makeSocketRateLimiter).
// `/anon` cannot say that and runs on makeRedisSocketRateLimiter.
export const messageLimiter = makeSocketRateLimiter(30, 10_000);