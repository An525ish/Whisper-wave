import { AppError } from '../../utils/AppError.js';
import {
  PRIVATE_INVITE_MAX_TTL_DAYS,
  PRIVATE_INVITE_MAX_USES,
  PRIVATE_ROOM_CAP_HARD,
  PRIVATE_ROOM_CAP_SOFT,
  PRIVATE_ROOM_IDLE_DAYS,
} from '../../constants/rooms.js';
import type { RoomRole, RoomVisibility } from '../../types/room.js';

/**
 * Pure rules for `private` rooms (HUB_PLAN §7.3). No I/O, so every rule is
 * unit-tested and shared by access, invites, creation and the idle purge.
 *
 * private = invite-only (like unlisted) AND members-only (no guests), never in
 * the lobby, never listing-requestable, no reminders, small, ephemeral.
 */
const DAY_MS = 24 * 3_600_000;

export const isPrivate = (visibility: RoomVisibility): boolean => visibility === 'private';

/** Anyone holding proof (invite, host/mod, seat) may enter; everyone else must have an invite. */
export const needsInviteProof = (
  visibility: RoomVisibility,
  role: RoomRole,
  seated: boolean
): boolean => visibility !== 'official' && visibility !== 'public' && role === 'member' && !seated;

/**
 * Verdict for a join that needs an invite. `not_found` for no/invalid proof
 * (identical to a missing slug — no enumeration); `members_only` ONLY once the
 * invite is valid, so the "sign in" answer never confirms a slug to a prober.
 */
export const decideInviteJoin = (params: {
  visibility: RoomVisibility;
  signedIn: boolean;
  inviteValid: boolean;
}): 'allow' | 'not_found' | 'members_only' => {
  if (!params.inviteValid) return 'not_found';
  if (isPrivate(params.visibility) && !params.signedIn) return 'members_only';
  return 'allow';
};

/** Caps are clamped for private rooms whatever the caller passed. */
export const clampRoomCaps = (
  visibility: RoomVisibility,
  caps: { capSoft?: number; capHard?: number }
): { capSoft?: number; capHard?: number } => {
  if (!isPrivate(visibility)) return caps;
  const capHard = Math.min(caps.capHard ?? PRIVATE_ROOM_CAP_HARD, PRIVATE_ROOM_CAP_HARD);
  const capSoft = Math.min(caps.capSoft ?? PRIVATE_ROOM_CAP_SOFT, PRIVATE_ROOM_CAP_SOFT, capHard);
  return { capSoft, capHard };
};

/**
 * Invite terms. Private rooms need a use limit (≤ 25) and a ttl ≤ 30 days:
 * over-limit values are clamped, a missing limit is refused (400).
 */
export const resolveInviteTerms = (
  visibility: RoomVisibility,
  input: { maxUses?: number | null; ttlDays?: number },
  defaultTtlDays: number
): { maxUses: number | null; ttlDays: number } => {
  const ttlDays = input.ttlDays ?? defaultTtlDays;
  if (!isPrivate(visibility)) return { maxUses: input.maxUses ?? null, ttlDays };
  if (input.maxUses === null || input.maxUses === undefined) {
    throw new AppError(400, 'Private-room invites need a use limit (up to 25)');
  }
  return {
    maxUses: Math.max(1, Math.min(input.maxUses, PRIVATE_INVITE_MAX_USES)),
    ttlDays: Math.max(1, Math.min(ttlDays, PRIVATE_INVITE_MAX_TTL_DAYS)),
  };
};

/** Idle deadline for a private room active at `now`. */
export const idleDeadline = (now: number = Date.now()): Date =>
  new Date(now + PRIVATE_ROOM_IDLE_DAYS * DAY_MS);

/** Lifecycle predicate: a private room past its deadline is purgeable. Missing deadline never is. */
export const isIdleExpired = (
  room: { visibility: RoomVisibility; expireAt?: Date | null },
  now: number = Date.now()
): boolean => isPrivate(room.visibility) && !!room.expireAt && room.expireAt.getTime() <= now;

/** Which of these rooms to purge: expired AND with nobody inside right now. */
export const selectPurgeable = <T extends { slug: string; visibility: RoomVisibility; expireAt?: Date | null }>(
  rooms: T[],
  now: number,
  hasLiveSeats: (slug: string) => boolean
): T[] => rooms.filter((r) => isIdleExpired(r, now) && !hasLiveSeats(r.slug));

/**
 * Admin edits never move a room across the private boundary: private rooms are
 * created by hosts (entitlement, limits), and "approving" one to public would
 * expose a room whose members joined on a members-only promise. Admins can
 * still edit copy/hours and close it.
 */
export const assertAdminVisibilityChange = (
  existing: RoomVisibility | null,
  requested: RoomVisibility
): void => {
  if (requested === 'private' && existing !== 'private') {
    throw new AppError(422, 'Private rooms are created by their hosts');
  }
  if (existing === 'private' && requested !== 'private') {
    throw new AppError(422, 'A private room can’t be made public — close it instead');
  }
};

/** Private rooms never ask for the lobby (the admin queue ignores them too). */
export const assertListingRequestable = (visibility: RoomVisibility): void => {
  if (isPrivate(visibility)) throw new AppError(409, 'Private rooms can’t be listed in the lobby');
};
