export type SocketRateLimiter = {
  allow(socketId: string): boolean;
  remove(socketId: string): void;
};

/** Simple per-socket sliding-window rate limiter. */
export const makeSocketRateLimiter = (
  maxEvents: number,
  windowMs: number
): SocketRateLimiter => {
  const timestamps = new Map<string, number[]>();
  return {
    allow(socketId: string): boolean {
      const now = Date.now();
      const cutoff = now - windowMs;
      const times = (timestamps.get(socketId) ?? []).filter((t) => t > cutoff);
      if (times.length >= maxEvents) return false;
      times.push(now);
      timestamps.set(socketId, times);
      return true;
    },
    remove(socketId: string): void {
      timestamps.delete(socketId);
    },
  };
};

// 30 messages / 10 s per socket — generous for normal use, stops floods.
// NOTE: in-process only — does not coordinate across multiple Node processes/workers.
// Replace with a Redis-backed limiter before horizontal scaling.
export const messageLimiter = makeSocketRateLimiter(30, 10_000);
