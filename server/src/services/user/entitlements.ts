import { isFeatureEnabled } from '../hub.js';
import * as boostRepo from '../../repositories/boostWallet.js';
import * as subscriptionRepo from '../../repositories/subscription.js';
import type { Entitlements } from '../../types/subscription.js';
import { logger } from '../../utils/logger.js';

/**
 * Entitlement SEAM (HUB_PLAN §5c, Spark Pass hooks). Every "may this account
 * do the premium-ish thing" question goes through here, so swapping the rule
 * later is a one-function change and no caller learns what the rule is.
 *
 * `canCreatePrivateRoom`: the `privateRooms` flag (kill-switch) AND a live Spark Pass.
 * Rooms someone already created keep running if their pass lapses (they expire on
 * their own idle timer); only creating new private rooms needs the pass.
 */
/** Pure: is a pass with this expiry live right now? Exported for tests. */
export const isPassActive = (expiresAt: Date | null | undefined, now: number = Date.now()): boolean =>
  Boolean(expiresAt) && expiresAt!.getTime() > now;

/**
 * Does this account hold a live Spark Pass? Fails CLOSED: a Mongo error means "no
 * pass" for this one check (a paying user briefly sees the free path), never a
 * free upgrade for everyone.
 */
export const hasPass = async (userId: string | undefined): Promise<boolean> => {
  if (!userId) return false;
  try {
    return isPassActive((await subscriptionRepo.findByUser(userId))?.expiresAt);
  } catch (err) {
    logger.warn({ err, userId }, 'Pass lookup failed: treating as no pass');
    return false;
  }
};

/** What the client may show for this account. Throws on DB failure (it is a read endpoint). */
export const getEntitlements = async (userId: string): Promise<Entitlements> => {
  const [sub, wallet] = await Promise.all([subscriptionRepo.findByUser(userId), boostRepo.findByUser(userId)]);
  const active = isPassActive(sub?.expiresAt);
  return {
    boost: {
      credits: wallet?.credits ?? 0,
      activeUntil: isPassActive(wallet?.activeUntil) ? wallet!.activeUntil!.toISOString() : null,
    },
    pass: {
      active,
      planId: active ? sub!.planId : null,
      expiresAt: active ? sub!.expiresAt.toISOString() : null,
    },
  };
};

export type PrivateRoomEligibility = 'ok' | 'flag_off' | 'not_entitled';

/** Creating a private room needs the feature flag (kill-switch) AND a live Spark Pass. */
export const decidePrivateRoomEligibility = (params: { flagOn: boolean; pass: boolean }): PrivateRoomEligibility => {
  if (!params.flagOn) return 'flag_off';
  return params.pass ? 'ok' : 'not_entitled';
};

export const privateRoomEligibility = async (
  userId: string,
  deps: { flagOn: () => boolean; pass: (id: string) => Promise<boolean> } = {
    flagOn: () => isFeatureEnabled('privateRooms'),
    pass: hasPass,
  }
): Promise<PrivateRoomEligibility> => {
  const flagOn = deps.flagOn();
  if (!flagOn) return 'flag_off';
  // `hasPass` fails closed, so a lookup error never creates a private room on a guess.
  return decidePrivateRoomEligibility({ flagOn, pass: await deps.pass(userId) });
};

export const canCreatePrivateRoom = async (userId: string): Promise<boolean> =>
  (await privateRoomEligibility(userId)) === 'ok';
