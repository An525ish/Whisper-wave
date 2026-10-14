import { isFeatureEnabled } from '../hub.js';
import { logger } from '../../utils/logger.js';
import { trustForUser } from './trust.js';
import type { TrustLevel } from '../../types/room.js';

/**
 * Entitlement SEAM (HUB_PLAN §5c, Spark Pass hooks). Every "may this account
 * do the premium-ish thing" question goes through here, so swapping the rule
 * later is a one-function change and no caller learns what the rule is.
 *
 * `canCreatePrivateRoom` today: signed-in account that is `trusted` (older than
 * 7 days, no recent strikes) AND the `privateRooms` flag is on. When Spark Pass
 * ships, replace `decidePrivateRoomEligibility`'s trust clause with the pass
 * check (keep the flag clause — it is the kill-switch). Nothing else changes.
 */
export type PrivateRoomEligibility = 'ok' | 'flag_off' | 'not_entitled';

export const decidePrivateRoomEligibility = (params: {
  flagOn: boolean;
  trust: TrustLevel | null;
}): PrivateRoomEligibility => {
  if (!params.flagOn) return 'flag_off';
  return params.trust === 'trusted' ? 'ok' : 'not_entitled';
};

export const privateRoomEligibility = async (
  userId: string,
  deps: {
    flagOn: () => boolean;
    trust: (id: string) => Promise<TrustLevel | null>;
  } = { flagOn: () => isFeatureEnabled('privateRooms'), trust: trustForUser }
): Promise<PrivateRoomEligibility> => {
  const flagOn = deps.flagOn();
  if (!flagOn) return 'flag_off';
  // A failed lookup fails CLOSED: no private room is created on a guess.
  const trust = await deps.trust(userId).catch((err: unknown) => {
    logger.warn({ err, userId }, 'Trust lookup failed — denying private room');
    return null;
  });
  return decidePrivateRoomEligibility({ flagOn, trust });
};

export const canCreatePrivateRoom = async (userId: string): Promise<boolean> =>
  (await privateRoomEligibility(userId)) === 'ok';
