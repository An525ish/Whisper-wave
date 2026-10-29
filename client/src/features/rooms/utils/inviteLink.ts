import { ROUTES } from '@/shared/constants/routes';
import { ROOM_INVITE_DAYS, ROOM_PRIVATE } from '../constants';
import type { RoomInviteTerms } from '../types';

/** Invite link for one token — the only way into an unlisted/private room. */
export const inviteUrl = (slug: string, token: string): string =>
  `${window.location.origin}${ROUTES.room(slug)}?invite=${token}`;

/** Web Share is a progressive enhancement; copy is always there. */
export const canWebShare = (): boolean => typeof navigator !== 'undefined' && typeof navigator.share === 'function';

const wholeInRange = (text: string, min: number, max: number): number | null => {
  const n = Number(text);
  return text.trim() !== '' && Number.isInteger(n) && n >= min && n <= max ? n : null;
};

/**
 * Turn the two form fields into invite terms. Private rooms require a use
 * limit (≤ 25) and ≤ 30 days; other rooms may leave uses blank for unlimited.
 * The server re-enforces all of it — this only keeps the form honest.
 */
export const buildInviteTerms = (
  isPrivate: boolean,
  usesText: string,
  daysText: string
): { terms: RoomInviteTerms } | { error: string } => {
  const ttlDays = wholeInRange(daysText, 1, ROOM_PRIVATE.INVITE_MAX_DAYS);
  if (ttlDays === null) return { error: `Valid for 1–${ROOM_PRIVATE.INVITE_MAX_DAYS} days` };
  if (usesText.trim() === '' && !isPrivate) return { terms: { maxUses: null, ttlDays } };
  const max = isPrivate ? ROOM_PRIVATE.INVITE_MAX_USES : 1000;
  const maxUses = wholeInRange(usesText, 1, max);
  if (maxUses === null) return { error: `Uses must be 1–${max}` };
  return { terms: { maxUses, ttlDays } };
};

export const defaultInviteFields = (isPrivate: boolean): { uses: string; days: string } => ({
  uses: isPrivate ? String(ROOM_PRIVATE.INVITE_DEFAULT_USES) : '',
  days: String(isPrivate ? ROOM_PRIVATE.INVITE_DEFAULT_DAYS : ROOM_INVITE_DAYS),
});
