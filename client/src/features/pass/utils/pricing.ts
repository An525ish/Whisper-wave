import dayjs from 'dayjs';
import type { PassPlan } from '../types';

const MS_PER_DAY = 86_400_000;

/** 4900 -> "₹49". Whole rupees only; every plan is priced in whole rupees. */
export const formatRupees = (paise: number): string =>
  `₹${(paise / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

/** The plan with the lowest price per day. Used to flag the best value, never invented. */
export const cheapestPerDay = (plans: readonly PassPlan[]): PassPlan | null =>
  plans.reduce<PassPlan | null>(
    (best, plan) => (!best || plan.amountPaise / plan.days < best.amountPaise / best.days ? plan : best),
    null
  );

/** "1 day left", "6 days left", or null once expired. Rounds up: 5h left is "1 day left". */
export const timeLeftLabel = (expiresAt: string | null, now: number = Date.now()): string | null => {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const days = Math.ceil(ms / MS_PER_DAY);
  return `${days} ${days === 1 ? 'day' : 'days'} left`;
};

/** "5 Nov, 4:52 PM" in the viewer's timezone. */
export const formatExpiry = (expiresAt: string): string => dayjs(expiresAt).format('D MMM, h:mm A');

/** "24 min left" while a boost runs, null once it is over. Rounds up, so 20s left is "1 min left". */
export const boostLeftLabel = (activeUntil: string | null, now: number = Date.now()): string | null => {
  if (!activeUntil) return null;
  const ms = new Date(activeUntil).getTime() - now;
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return `${Math.ceil(ms / 60_000)} min left`;
};
