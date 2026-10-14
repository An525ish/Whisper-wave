import * as roomRepo from '../../repositories/room.js';
import { PRIVATE_ROOM_MAX_PER_USER } from '../../constants/rooms.js';
import { AppError } from '../../utils/AppError.js';
import { privateRoomEligibility, type PrivateRoomEligibility } from '../user/entitlements.js';
import { isRoomOpen } from './hours.js';
import { deriveRoomStatus, isStaffed } from './modPresence.js';
import type { MyRoom } from '../../types/roomAdmin.js';

/**
 * Hosts find their rooms again (private rooms are in no lobby): everything
 * the caller created, any visibility. Titles of the caller's OWN rooms only.
 */
export const listMyRooms = async (userId: string, now: Date = new Date()): Promise<MyRoom[]> =>
  (await roomRepo.listByCreator(userId)).map((t) => ({
    slug: t.slug,
    title: t.title,
    visibility: t.visibility,
    status: deriveRoomStatus({
      hoursOpen: isRoomOpen(t.hours, now),
      requiresModPresence: t.requiresModPresence === true,
      staffed: isStaffed(t.slug),
    }),
  }));

/** What the create sheet needs to show the right private-room state up front. */
export const privateRoomCapability = async (
  userId: string
): Promise<{ eligibility: PrivateRoomEligibility; active: number; limit: number }> => {
  const [eligibility, active] = await Promise.all([
    privateRoomEligibility(userId),
    roomRepo.countByCreator(userId, 'private'),
  ]);
  return { eligibility, active, limit: PRIVATE_ROOM_MAX_PER_USER };
};

/** Gate for creating a private room: flag, entitlement (the seam), then the per-user limit. */
export const assertCanCreatePrivateRoom = async (userId: string): Promise<void> => {
  const { eligibility, active, limit } = await privateRoomCapability(userId);
  if (eligibility === 'flag_off') throw new AppError(403, 'Private rooms are switched off right now');
  if (eligibility === 'not_entitled') {
    throw new AppError(403, 'Private rooms are available to established accounts — keep using Wave and try again later');
  }
  if (active >= limit) throw new AppError(409, `You can host up to ${limit} private rooms — delete one first`);
};
