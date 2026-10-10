import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import * as roomRepo from '../../repositories/room.js';
import * as roomBanRepo from '../../repositories/roomBan.js';
import { recordStrike } from '../user/trust.js';
import { liveCounts } from '../rooms/registry.js';
import { isRoomOpen } from '../rooms/hours.js';
import type { AdminRoomBanBody, AdminRoomUpsertBody } from '../../types/adminInput.js';

/**
 * Every template with live occupancy and open state — the approval queue
 * reads this (unlisted rooms appear here, never in the public lobby).
 */
export const listRoomsAdmin = async (now: Date = new Date()) => {
  const templates = await roomRepo.listAll();
  return templates.map((t) => ({
    slug: t.slug,
    title: t.title,
    description: t.description,
    rules: t.rules,
    lang: t.lang,
    official: t.official,
    hours: t.hours ?? null,
    capSoft: t.capSoft,
    capHard: t.capHard,
    visibility: t.visibility,
    listingRequestedAt: t.listingRequestedAt ?? null,
    createdAt: t.createdAt,
    open: isRoomOpen(t.hours, now),
    instances: liveCounts(t.slug),
  }));
};

/** Create or edit a template (official rooms included). Slug is the identity. */
export const upsertRoom = async (input: AdminRoomUpsertBody) => {
  const room = await roomRepo.upsertBySlug({
    slug: input.slug,
    title: input.title,
    description: input.description,
    rules: input.rules,
    lang: input.lang,
    official: input.official,
    hours: input.hours,
    visibility: input.visibility,
    ...(input.mods !== undefined ? { mods: input.mods } : {}),
  });
  // Approving to public consumes the listing request — the queue empties itself.
  if (input.visibility === 'public') {
    await roomRepo.clearListingRequest(input.slug).catch((err: unknown) =>
      logger.warn({ err, slug: input.slug }, 'Approved listing but failed to clear the request flag')
    );
  }
  return room;
};

export const listRoomBans = async () => roomBanRepo.listBans();

export const banIdentity = async (input: AdminRoomBanBody) => {
  const ban = await roomBanRepo.ban({
    roomSlug: input.roomSlug,
    gid: input.gid,
    userId: input.userId,
    minutes: input.minutes,
    reason: input.reason,
    by: 'admin',
  });
  // A ban is a strike: trust decays by age, so repeat offenders sink without
  // a separate review queue. Best-effort — the ban stands regardless.
  if (input.userId) {
    await recordStrike(input.userId, input.reason).catch((err: unknown) =>
      logger.warn({ err, userId: input.userId }, 'Ban recorded without a strike')
    );
  }
  return ban;
};

/** Lift a ban. False means nothing was holding them — still a 404. */
export const liftRoomBan = async (id: string): Promise<void> => {
  const lifted = await roomBanRepo.liftBan(id);
  if (!lifted) throw new AppError(404, 'Ban not found');
};
