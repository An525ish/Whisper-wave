import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import { ROOM_ERROR_CODES } from '../../constants/room-events.js';
import * as roomRepo from '../../repositories/room.js';
import * as roomBanRepo from '../../repositories/roomBan.js';
import { assertJoinAllowed, resolveRoomRole } from './membership.js';
import { redeemInviteForJoin, validateInviteForRoom } from './invites.js';
import { trustForUser } from '../user/trust.js';
import { isFeatureEnabled } from '../hub.js';
import { decideInviteJoin, isPrivate, needsInviteProof } from './privatePolicy.js';
import { touchPrivateRoom } from './lifecycle.js';
import type { IRoomFields, RoomRole, TrustLevel } from '../../types/room.js';

type Who = { gid: string; userId?: string };

/** Connect-time ban gate: only a GLOBAL ban refuses the socket itself (room bans bite at join). */
export const assertNotGloballyBanned = async ({ gid, userId }: Who): Promise<void> => {
  const bans = await roomBanRepo.findLiveBans({ gid, userId });
  if (bans.some((ban) => ban.roomSlug === null)) throw new AppError(403, ROOM_ERROR_CODES.BANNED);
};

/**
 * Everything a join needs decided before a seat is taken, in the order that
 * keeps it safe:
 *
 * 1. template exists, and — for unlisted/private rooms — the caller holds PROOF (a
 *    valid invite peeked without spending, host/mod status, or a seat they
 *    already hold). No proof is `not_found`, indistinguishable from a missing
 *    slug, so private slugs cannot be enumerated.
 * 2. hours + bans (a banned identity never spends an invite use).
 * 3. only then is an invite use spent — once per identity, see invites.ts.
 *
 * `seated` = this identity currently holds a seat in this room (a refresh or
 * alias change). A kick removes the seat, so it never excuses the invite.
 */
export const authorizeJoin = async (params: Who & {
  slug: string;
  invite?: string;
  seated: boolean;
}): Promise<{ template: IRoomFields; role: RoomRole; trust: TrustLevel | null }> => {
  const { slug, gid, userId, invite, seated } = params;
  const template = await roomRepo.findBySlug(slug);
  if (!template) throw new AppError(404, ROOM_ERROR_CODES.NOT_FOUND);

  const role = resolveRoomRole(template, userId);
  const needsInvite = needsInviteProof(template.visibility, role, seated);
  if (needsInvite) {
    const verdict = decideInviteJoin({
      visibility: template.visibility,
      signedIn: Boolean(userId),
      inviteValid: Boolean(invite && (await validateInviteForRoom(template.slug, invite))),
    });
    if (verdict === 'not_found') throw new AppError(404, ROOM_ERROR_CODES.NOT_FOUND);
    // Private rooms are members-only; the guest holds a valid invite, so naming
    // the reason ("sign in") leaks nothing a prober could use. No use is spent.
    if (verdict === 'members_only') throw new AppError(403, ROOM_ERROR_CODES.MEMBERS_ONLY);
  }
  // Kill-switch for the private surface — only after proof, so it never
  // confirms a private slug to someone without an invite.
  if (isPrivate(template.visibility) && !isFeatureEnabled('privateRooms')) {
    throw new AppError(403, ROOM_ERROR_CODES.FEATURE_OFF);
  }

  const bans = await roomBanRepo.findLiveBans({ gid, userId });
  assertJoinAllowed({ template, bans });

  if (needsInvite && invite) {
    await redeemInviteForJoin(template.slug, invite, userId ? [gid, userId] : [gid]);
  }

  if (isPrivate(template.visibility)) touchPrivateRoom(template.slug);

  // One account read per join (not per message): trust rides the member record
  // so the hot path stays Mongo-free. Guests have none.
  const trust = userId
    ? await trustForUser(userId).catch((err: unknown) => {
        logger.warn({ err, gid }, 'Trust lookup failed — joining as new');
        return null;
      })
    : null;
  return { template, role, trust };
};
