import * as userRepo from '../../repositories/user.js';

/**
 * Trust ladder (HUB_PLAN §6.2): `new` → `standard` → `trusted`.
 *
 * - `standard`: account older than 24 h.
 * - `trusted`: older than 7 days with no strikes in the last 30.
 *
 * Computed, never stored: strikes age out by themselves, so no decay job
 * exists to forget. Callers that need it per message resolve it once (at
 * join) and carry it — rooms stay Mongo-free on the hot path.
 */
export type TrustLevel = 'new' | 'standard' | 'trusted';

const DAY_MS = 24 * 3_600_000;

export const computeTrust = (params: {
  createdAt: Date | string;
  strikes?: Array<{ at: Date | string }>;
  now?: number;
}): TrustLevel => {
  const now = params.now ?? Date.now();
  const age = now - new Date(params.createdAt).getTime();
  const recentStrikes = (params.strikes ?? []).filter(
    (s) => now - new Date(s.at).getTime() < 30 * DAY_MS
  ).length;
  if (age >= 7 * DAY_MS && recentStrikes === 0) return 'trusted';
  if (age >= DAY_MS) return 'standard';
  return 'new';
};

/** Trust for an account id (null when the account is gone). */
export const trustForUser = async (userId: string): Promise<TrustLevel | null> => {
  const user = await userRepo.findByIdLean(userId);
  if (!user || !user.createdAt) return null;
  return computeTrust({ createdAt: user.createdAt, strikes: user.strikes });
};

/** Record abuse. Strikes older than 30 days stop counting on their own. */
export const recordStrike = async (userId: string, reason: string): Promise<void> => {
  await userRepo.pushStrike(userId, reason);
};
