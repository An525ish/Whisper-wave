import { PUSH_THROTTLE_MS } from '../../constants/push.js';
import type { PushThrottle } from '../../types/push.js';

/**
 * In-process (userId, tag) rate limit. Deliberately not Redis: every check would
 * be a billed command. Pruned lazily on use, so no timer keeps the process alive.
 * A caller may pass its own window per check (e.g. a 10-minute nudge tag); each
 * entry remembers the window it was recorded with, so pruning stays correct.
 */
export const createThrottle = (
  windowMs: number = PUSH_THROTTLE_MS,
  now: () => number = Date.now
): PushThrottle => {
  const last = new Map<string, { at: number; window: number }>();
  let lastPrune = now();

  const prune = (t: number): void => {
    if (t - lastPrune < windowMs) return;
    lastPrune = t;
    for (const [key, entry] of last) {
      if (t - entry.at >= entry.window) last.delete(key);
    }
  };

  return {
    allow: (userId, tag, window = windowMs) => {
      const t = now();
      prune(t);
      const key = `${userId}|${tag}`;
      const prev = last.get(key);
      if (prev !== undefined && t - prev.at < window) return false;
      last.set(key, { at: t, window });
      return true;
    },
  };
};
