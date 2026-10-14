import * as roomRepo from '../../repositories/room.js';
import { liveCounts } from './registry.js';
import { isRoomOpen } from './hours.js';
import { deriveRoomStatus, isStaffed } from './modPresence.js';
import { validateInviteForRoom } from './invites.js';
import { assertCanManageRoom, resolveRoomRole } from './membership.js';
import { assertCanCreatePrivateRoom } from './myRooms.js';
import { deleteRoomDependents } from './lifecycle.js';
import { assertListingRequestable, clampRoomCaps, idleDeadline } from './privatePolicy.js';
import { trustForUser } from '../user/trust.js';
import { screenText } from './automod.js';
import { ROOM_MAX_PER_USER, ROOM_RULES_VERSION } from '../../constants/rooms.js';
import { withKeyedLock } from '../../utils/keyedLock.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import type { IRoomFields } from '../../types/room.js';
import type { CreateUserRoomInput, LobbyRoom } from '../../types/roomAdmin.js';

/**
 * Lobby list: official templates plus approved public rooms, each with live
 * occupancy and open/closed state. Unlisted rooms never appear here — the
 * lobby is the amplifier, and listing requires approval.
 */
export const listLobbyRooms = async (now: Date = new Date()): Promise<LobbyRoom[]> => {
  const templates = await roomRepo.listLobby();
  return templates.map((t) => toLobbyRoom(t, now));
};

export const getRoomInfo = async (
  slug: string,
  now: Date = new Date(),
  invite?: string,
  userId?: string
): Promise<(LobbyRoom & { rules: string[]; visibility: IRoomFields['visibility'] }) | null> => {
  const template = await roomRepo.findBySlug(slug);
  if (!template) return null;
  if (template.visibility !== 'official' && template.visibility !== 'public') {
    // Unlisted/private rooms are unreachable without proof — a valid invite, or
    // being the host/mod. The slug alone, being user-chosen, is not a secret,
    // and no-proof is a plain 404 (never the title) so private rooms can't be probed.
    const isStaff = userId !== undefined && resolveRoomRole(template, userId) !== 'member';
    if (!isStaff) {
      if (!invite) return null;
      if (!(await validateInviteForRoom(slug, invite))) return null;
    }
  }
  return { ...toLobbyRoom(template, now), rules: template.rules, visibility: template.visibility };
};

/**
 * Edit/delete authority for the host-facing paths: the HOST only (a `mods[]`
 * entry moderates live chat, it does not own the room), and never an official
 * room — those move through admin. Non-hosts get 404, like missing rooms.
 */
export const assertIsEditableByHost = (
  template: Pick<IRoomFields, 'official' | 'createdBy'> | null,
  userId: string
): void => {
  if (!template) throw new AppError(404, 'Room not found');
  if (template.official) throw new AppError(403, 'Official rooms are edited by the Wave team');
  if (template.createdBy?.toString() !== userId) throw new AppError(404, 'Room not found');
};

/** Reject room copy the automod would block — rooms are public surfaces. */
export const assertCopyAllowed = (fields: string[]): void => {
  for (const text of fields) {
    const verdict = screenText(text);
    if (!verdict.ok) throw new AppError(422, 'That text isn’t allowed in a public room — please reword it');
  }
};

/** Host content edit — title, description, rules. Never slug/type/visibility. */
export const editRoomContent = async (params: {
  slug: string;
  userId: string;
  title: string;
  description: string;
  rules: string[];
}): Promise<void> => {
  const template = await roomRepo.findBySlug(params.slug);
  assertIsEditableByHost(template, params.userId);
  assertCopyAllowed([params.title, params.description, ...params.rules]);
  const updated = await roomRepo.updateContent(params.slug, {
    title: params.title,
    description: params.description,
    rules: params.rules,
  });
  if (!updated) throw new AppError(404, 'Room not found');
};

/** Host delete — template only; reports, bans and audit history stay. */
export const deleteRoom = async (slug: string, userId: string): Promise<void> => {
  const template = await roomRepo.findBySlug(slug);
  assertIsEditableByHost(template, userId);
  const deleted = await roomRepo.deleteBySlug(slug);
  if (!deleted) throw new AppError(404, 'Room not found');
  // Links and reminders die with the room — a re-created slug must not honour old invites.
  await deleteRoomDependents(slug);
};

/** Host asks for lobby listing. Only unlisted rooms can ask. */
export const requestRoomListing = async (slug: string, userId: string): Promise<void> => {
  const template = await roomRepo.findBySlug(slug);
  assertCanManageRoom(template, userId);
  // Private rooms are never listable; refuse explicitly (the repo filter would only 404).
  if (template) assertListingRequestable(template.visibility);
  const requested = await roomRepo.requestListing(slug);
  if (!requested) throw new AppError(404, 'Room not found');
};

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;

/**
 * Create a user room: unlisted until approved, creator recorded (host role),
 * the accepted rules stored on the template. Public listing is a separate
 * approval step — creation never publishes.
 *
 * Trusted creators (D4 amended) keep instant listing: an account older than
 * 7 days with a clean 30 days. Everyone else starts unlisted until approved.
 * Caps active rooms per host and screens the public copy.
 */
export const createUserRoom = (input: CreateUserRoomInput) =>
  // Serialised per host: the room-count and private-room limits are count-then-create,
  // so two parallel requests could otherwise both pass the check.
  withKeyedLock(`create-room:${input.userId}`, () => createUserRoomUnlocked(input));

const createUserRoomUnlocked = async (input: CreateUserRoomInput) => {
  assertCopyAllowed([input.title, input.description, ...input.rules]);
  if ((await roomRepo.countByCreator(input.userId)) >= ROOM_MAX_PER_USER) {
    throw new AppError(409, `You can host up to ${ROOM_MAX_PER_USER} rooms — delete one first`);
  }
  const wantsPrivate = input.visibility === 'private';
  if (wantsPrivate) await assertCanCreatePrivateRoom(input.userId);
  let visibility: IRoomFields['visibility'] = wantsPrivate ? 'private' : 'unlisted';
  try {
    if (!wantsPrivate && (await trustForUser(input.userId)) === 'trusted') visibility = 'public';
  } catch (err) {
    logger.warn({ err, userId: input.userId }, 'Trust lookup failed — creating unlisted');
  }
  try {
    return await roomRepo.create({
      slug: input.slug,
      title: input.title,
      description: input.description,
      rules: input.rules,
      lang: input.lang,
      official: false,
      createdBy: input.userId,
      visibility,
      // Private: small caps whatever the input, and the idle clock starts now.
      ...clampRoomCaps(visibility, {}),
      expireAt: wantsPrivate ? idleDeadline() : null,
      rulesAcceptedAt: new Date(),
      rulesAcceptedBy: input.userId,
      rulesVersion: ROOM_RULES_VERSION,
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new AppError(409, 'That room name is taken — try another');
    }
    throw err;
  }
};

const toLobbyRoom = (
  t: Pick<IRoomFields, 'slug' | 'title' | 'description' | 'lang' | 'official' | 'hours' | 'requiresModPresence'>,
  now: Date
): LobbyRoom => {
  const instances = liveCounts(t.slug)
    .map(({ instanceId, online }) => ({
      n: Number(instanceId.split('#').pop() ?? 1),
      online,
    }))
    .filter((i) => i.online > 0);
  const requiresModPresence = t.requiresModPresence === true;
  const status = deriveRoomStatus({
    hoursOpen: isRoomOpen(t.hours, now),
    requiresModPresence,
    staffed: isStaffed(t.slug),
  });
  return {
    slug: t.slug,
    title: t.title,
    description: t.description,
    lang: t.lang,
    official: t.official,
    open: status === 'open',
    status,
    requiresModPresence,
    hours: t.hours ?? null,
    instances,
    totalOnline: instances.reduce((sum, i) => sum + i.online, 0),
  };
};
