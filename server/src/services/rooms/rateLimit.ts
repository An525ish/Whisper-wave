/**
 * Per-identity sliding window, pruned by a timer.
 *
 * The shared socket-limiter factory keys by socket id and never sweeps (a
 * socket is held by one process for life). Room limits key by `gid`, which
 * outlives any socket — so an unref'd interval drops expired entries once per
 * window; `allow` itself only ever touches its own key (O(window), not O(keys)).
 * Same fail-open spirit as the Redis limiter: a limiter must never become the
 * outage.
 */
export const makeRoomRateLimiter = (
  maxEvents: number,
  windowMs: number
): { allow(key: string): boolean; remove(key: string): void } => {
  const hits = new Map<string, number[]>();

  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, times] of hits) {
      const live = times.filter((t) => t > cutoff);
      if (live.length > 0) hits.set(key, live);
      else hits.delete(key);
    }
  }, Math.max(windowMs, 1_000)).unref();

  return {
    allow(key: string): boolean {
      const now = Date.now();
      const times = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
      if (times.length >= maxEvents) {
        hits.set(key, times);
        return false;
      }
      times.push(now);
      hits.set(key, times);
      return true;
    },
    remove(key: string): void {
      hits.delete(key);
    },
  };
};

/** 20 posts / 10 s per identity — slow mode (2–3 s) is the real pacing. */
export const roomMessageLimiter = makeRoomRateLimiter(20, 10_000);

/** 30 reactions / minute per identity — taps are cheap, floods are not. */
export const roomReactionLimiter = makeRoomRateLimiter(30, 60_000);

/** 5 joins / 10 s per identity — a join walks Mongo, so reconnect storms are capped here. */
export const roomJoinLimiter = makeRoomRateLimiter(5, 10_000);
