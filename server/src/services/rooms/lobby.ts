import * as roomRepo from '../../repositories/room.js';
import { liveCounts } from './registry.js';
import { isRoomOpen } from './hours.js';
import { validateInviteForRoom } from './invites.js';
import { assertCanManageRoom } from './membership.js';
import { trustForUser } from '../user/trust.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import type { IRoomFields } from '../../types/room.js';

export type LobbyRoom = {
  slug: string;
  title: string;
  description: string;
  lang: string;
  official: boolean;
  open: boolean;
  hours: IRoomFields['hours'];
  /** Instances with anyone in them — quiet rooms list nothing (honest counts). */
  instances: Array<{ n: number; online: number }>;
  totalOnline: number;
};

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
  invite?: string
): Promise<(LobbyRoom & { rules: string[] }) | null> => {
  const template = await roomRepo.findBySlug(slug);
  if (!template) return null;
  if (template.visibility !== 'official' && template.visibility !== 'public') {
    // Unlisted rooms are unreachable without a valid invite — the slug
    // alone, being user-chosen, is not a secret.
    if (!invite) return null;
    if (!(await validateInviteForRoom(slug, invite))) return null;
  }
  return { ...toLobbyRoom(template, now), rules: template.rules };
};

export type CreateUserRoomInput = {
  slug: string;
  title: string;
  description: string;
  rules: string[];
  lang: string;
  userId: string;
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
  assertCanManageRoom(template, params.userId);
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
  assertCanManageRoom(template, userId);
  if (template?.official) throw new AppError(403, 'Official rooms retire via admin, not deletion');
  const deleted = await roomRepo.deleteBySlug(slug);
  if (!deleted) throw new AppError(404, 'Room not found');
};

/** Host asks for lobby listing. Only unlisted rooms can ask. */
export const requestRoomListing = async (slug: string, userId: string): Promise<void> => {
  const template = await roomRepo.findBySlug(slug);
  assertCanManageRoom(template, userId);
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
 * Trusted creators skip the queue: an account older than 7 days with a clean
 * 30 days has earned instant listing. Everyone else starts unlisted.
 */
export const createUserRoom = async (input: CreateUserRoomInput) => {
  let visibility: IRoomFields['visibility'] = 'unlisted';
  try {
    if ((await trustForUser(input.userId)) === 'trusted') visibility = 'public';
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
    });
  } catch (err) {
    if (isDuplicateKeyError(err)) {
      throw new AppError(409, 'That room name is taken — try another');
    }
    throw err;
  }
};

const toLobbyRoom = (
  t: Pick<IRoomFields, 'slug' | 'title' | 'description' | 'lang' | 'official' | 'hours'>,
  now: Date
): LobbyRoom => {
  const instances = liveCounts(t.slug)
    .map(({ instanceId, online }) => ({
      n: Number(instanceId.split('#').pop() ?? 1),
      online,
    }))
    .filter((i) => i.online > 0);
  return {
    slug: t.slug,
    title: t.title,
    description: t.description,
    lang: t.lang,
    official: t.official,
    open: isRoomOpen(t.hours, now),
    hours: t.hours ?? null,
    instances,
    totalOnline: instances.reduce((sum, i) => sum + i.online, 0),
  };
};
