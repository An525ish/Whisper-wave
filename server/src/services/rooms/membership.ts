import { AppError } from '../../utils/AppError.js';
import { ROOM_ERROR_CODES } from '../../constants/room-events.js';
import { isRoomOpen } from './hours.js';
import type {
  IRoomBanFields,
  IRoomFields,
  RoomMemberIdentity,
  RoomRole,
} from '../../types/room.js';

/**
 * Join eligibility: template exists, hours admit now, no live ban covers this
 * identity. Throws `AppError` whose message IS the client-facing `code`, so
 * the namespace forwards it untouched — codes are the stable contract.
 */
export const assertJoinAllowed = (params: {
  template: IRoomFields | null;
  bans: IRoomBanFields[];
  now?: Date;
}): void => {
  if (!params.template) throw new AppError(404, ROOM_ERROR_CODES.NOT_FOUND);
  if (!isRoomOpen(params.template.hours, params.now)) {
    throw new AppError(403, ROOM_ERROR_CODES.CLOSED);
  }
  const applies = params.bans.some(
    (ban) => ban.roomSlug === null || ban.roomSlug === params.template?.slug
  );
  if (applies) throw new AppError(403, ROOM_ERROR_CODES.BANNED);
};

/** Persona color: client-chosen hex wins, otherwise stable per alias. */
const ALIAS_COLORS = [
  '#7dffb8', '#7db8ff', '#ff7db8', '#ffd47d',
  '#b87dff', '#7dffe3', '#ff9d7d', '#d4ff7d',
];

export const colorForAlias = (alias: string): string => {
  let hash = 0;
  for (let i = 0; i < alias.length; i += 1) {
    hash = (hash * 31 + alias.charCodeAt(i)) >>> 0;
  }
  return ALIAS_COLORS[hash % ALIAS_COLORS.length];
};

export const identityOf = (params: {
  userId?: string;
  gid?: string;
}): RoomMemberIdentity =>
  params.userId
    ? { kind: 'member', userId: params.userId, ...(params.gid ? { gid: params.gid } : {}) }
    : { kind: 'guest', gid: params.gid };

/**
 * Role at join: template mods and the room creator moderate; everyone else
 * participates. Recomputed on every join so admin edits apply immediately.
 */
export const resolveRoomRole = (
  template: { createdBy?: unknown; mods?: Array<{ toString(): string }> },
  userId: string | undefined
): RoomRole => {
  if (!userId) return 'member';
  if (template.mods?.some((m) => m.toString() === userId)) return 'mod';
  const createdBy = template.createdBy as { toString(): string } | null | undefined;
  if (createdBy && createdBy.toString() === userId) return 'host';
  return 'member';
};

/**
 * Hosts and their mods manage a room (invites, edits, deletion); everyone
 * else gets a 404, not a 403 — unlisted rooms don't confirm their existence.
 */
export const assertCanManageRoom = (
  template: { createdBy?: unknown; mods?: Array<{ toString(): string }> } | null,
  userId: string
): void => {
  if (!template) throw new AppError(404, 'Room not found');
  const isHost =
    (template.createdBy as { toString(): string } | null)?.toString() === userId;
  const isMod = template.mods?.some((m) => m.toString() === userId) ?? false;
  if (!isHost && !isMod) throw new AppError(404, 'Room not found');
};
