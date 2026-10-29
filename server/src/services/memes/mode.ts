import * as userRepo from '../../repositories/user.js';

/**
 * A member's stored unfiltered opt-in, cached per user so the public feed
 * does not `findById` on every request. Entries live 60 s and the map is
 * bounded; a mode change here invalidates at once (another instance may serve
 * the old mode for up to a minute — opting out is never instant cluster-wide).
 */
const TTL_MS = 60_000;
const MAX_ENTRIES = 5000;

const cache = new Map<string, { on: boolean; until: number }>();

export const getMemeUnfiltered = async (userId: string): Promise<boolean> => {
  const hit = cache.get(userId);
  if (hit && hit.until > Date.now()) return hit.on;
  const on = await userRepo.getMemeUnfiltered(userId);
  if (cache.size >= MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.delete(userId);
  cache.set(userId, { on, until: Date.now() + TTL_MS });
  return on;
};

export const setMemeUnfiltered = async (userId: string, on: boolean): Promise<void> => {
  await userRepo.setMemeUnfiltered(userId, on);
  cache.delete(userId);
};
