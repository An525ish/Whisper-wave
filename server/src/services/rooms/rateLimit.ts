/**
 * Per-identity sliding window with lazy self-cleaning.
 *
 * The shared socket-limiter factory keys by socket id and never sweeps (a
 * socket is held by one process for life). Room limits key by `gid`, which
 * outlives any socket — so this variant prunes expired entries whenever the
 * map grows past a bound. Same fail-open spirit as the Redis limiter: a
 * limiter must never become the outage.
 */
export const makeRoomRateLimiter = (
  maxEvents: number,
  windowMs: number,
  maxKeys = 10_000
): { allow(key: string): boolean; remove(key: string): void } => {
  const hits = new Map<string, number[]>();

  const prune = (now: number): void => {
    for (const [key, times] of hits) {
      const live = times.filter((t) => t > now - windowMs);
      if (live.length > 0) hits.set(key, live);
      else hits.delete(key);
    }
  };

  return {
    allow(key: string): boolean {
      const now = Date.now();
      if (hits.size > maxKeys) prune(now);
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
