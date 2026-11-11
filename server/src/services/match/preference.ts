import type { WaitingCard } from '../../types/match.js';

/**
 * Spark Pass gender preference. For this long after entering the queue a preference
 * is strict; after it, the person is matched with anyone. Gender is self-declared
 * and unverified, so a hard promise would be one we cannot keep.
 */
export const PREFER_HOLD_MS = 20_000;

type Prefs = Pick<WaitingCard, 'prefer' | 'preferSince'>;
type Partner = Pick<WaitingCard, 'gender'>;

export const isHolding = (card: Prefs, now: number): boolean =>
  Boolean(card.prefer) && card.preferSince !== undefined && now < card.preferSince + PREFER_HOLD_MS;

const fits = (card: Prefs, partner: Partner): boolean => !card.prefer || card.prefer === partner.gender;

export const acceptsPartner = (card: Prefs, partner: Partner, now: number): boolean =>
  !isHolding(card, now) || fits(card, partner);

export const matchesPreference = (self: Prefs, partner: Partner): boolean =>
  Boolean(self.prefer) && fits(self, partner);

export const holdRemainingMs = (card: Prefs, now: number): number =>
  isHolding(card, now) ? card.preferSince! + PREFER_HOLD_MS - now : 0;
