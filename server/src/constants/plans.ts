import type { BoostPack, PassPlan, PlanId } from '../types/subscription.js';

/**
 * The ONLY price table. Orders are created from this, never from a client
 * amount, and the client reads it back through `GET /api/payments/plans`.
 * Amounts are in paise (INR). Fixed-duration passes: no auto-renew (D19).
 */
export const PASS_PLANS: readonly PassPlan[] = [
  { id: 'day', label: 'Day', days: 1, amountPaise: 1900 },
  { id: 'week', label: 'Week', days: 7, amountPaise: 4900 },
  { id: 'month', label: 'Month', days: 30, amountPaise: 9900 },
  { id: 'year', label: 'Year', days: 365, amountPaise: 69900 },
];

/** Boost packs: consumable credits. One credit = one `BOOST_MS` window of front-of-queue. */
export const BOOST_PACKS: readonly BoostPack[] = [
  { id: 'boost1', label: '1 boost', credits: 1, amountPaise: 900 },
  { id: 'boost5', label: '5 boosts', credits: 5, amountPaise: 2900 },
];

export const BOOST_MS = 30 * 60 * 1000;

export const findBoostPack = (id: string): BoostPack | undefined => BOOST_PACKS.find((p) => p.id === id);

export const PLAN_CURRENCY = 'INR';

export const findPlan = (id: string): PassPlan | undefined =>
  PASS_PLANS.find((plan) => plan.id === id);

export const DAY_MS = 24 * 60 * 60 * 1000;

/** A created order older than this is considered abandoned (reconcile / cleanup). */
export const ORDER_STALE_MS = 60 * 60 * 1000;

export type { PlanId };
