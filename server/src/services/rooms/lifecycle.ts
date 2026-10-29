import * as roomRepo from '../../repositories/room.js';
import * as inviteRepo from '../../repositories/roomInvite.js';
import * as reminderRepo from '../../repositories/roomReminder.js';
import { logger } from '../../utils/logger.js';
import { liveCounts } from './registry.js';
import { idleDeadline, selectPurgeable } from './privatePolicy.js';

/**
 * Private-room lifecycle: no join for 30 days → the room, its invites and any
 * reminders are deleted (reports, bans and the audit trail stay — HUB_PLAN §9).
 *
 * Mechanism: `expireAt` is stamped at creation and pushed out on join
 * (throttled to one write per room per hour); the existing rooms sweep tick
 * calls `purgeIdlePrivateRooms`, itself throttled to hourly. Explicit purge
 * rather than a Mongo TTL index because a TTL delete cannot cascade to invites.
 */
const TOUCH_EVERY_MS = 3_600_000;
const PURGE_EVERY_MS = 3_600_000;
const lastTouch = new Map<string, number>();
let lastPurge = 0;

/** Remove a room's dependents. Called by host delete and the idle purge. */
export const deleteRoomDependents = async (slug: string): Promise<void> => {
  await Promise.all([inviteRepo.deleteForRoom(slug), reminderRepo.removeForSlug(slug)]);
};

/** Fire-and-forget activity stamp for a private room; never blocks or fails a join. */
export const touchPrivateRoom = (slug: string, now: number = Date.now()): void => {
  if (now - (lastTouch.get(slug) ?? 0) < TOUCH_EVERY_MS) return;
  lastTouch.set(slug, now);
  roomRepo.setExpireAt(slug, idleDeadline(now)).catch((err: unknown) => {
    lastTouch.delete(slug);
    logger.warn({ err, slug }, 'Could not refresh private room expiry');
  });
};

/** Hourly at most; returns the slugs deleted. Rooms with someone inside are never purged. */
export const purgeIdlePrivateRooms = async (now: number = Date.now()): Promise<string[]> => {
  if (now - lastPurge < PURGE_EVERY_MS) return [];
  lastPurge = now;
  try {
    const expired = await roomRepo.listExpiredPrivate(new Date(now));
    const hasLive = (slug: string): boolean => liveCounts(slug).some((c) => c.online > 0);
    const purged: string[] = [];
    for (const { slug } of selectPurgeable(expired, now, hasLive)) {
      await roomRepo.deleteBySlug(slug);
      await deleteRoomDependents(slug);
      lastTouch.delete(slug);
      purged.push(slug);
    }
    return purged;
  } catch (err) {
    logger.warn({ err }, 'Private room purge failed — will retry next hour');
    return [];
  }
};

/** Live instance ids of private rooms — closed when the `privateRooms` kill-switch flips off. */
export const livePrivateInstanceIds = async (): Promise<string[]> => {
  const slugs = await roomRepo.listPrivateSlugs();
  return slugs.flatMap((slug) => liveCounts(slug).map((c) => c.instanceId));
};
