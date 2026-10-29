import { randomBytes } from 'node:crypto';
import { AppError } from '../../utils/AppError.js';
import { ROOM_ERROR_CODES } from '../../constants/room-events.js';
import * as roomRepo from '../../repositories/room.js';
import * as inviteRepo from '../../repositories/roomInvite.js';
import { assertCanManageRoom } from './membership.js';
import { resolveInviteTerms } from './privatePolicy.js';

const DEFAULT_TTL_DAYS = 7;

export const createInvite = async (params: {
  slug: string;
  userId: string;
  maxUses?: number | null;
  ttlDays?: number;
}): Promise<{ token: string; expiresAt: Date }> => {
  const template = await roomRepo.findBySlug(params.slug);
  assertCanManageRoom(template, params.userId);
  // Private rooms: a use limit is mandatory and ttl/uses are clamped (privatePolicy).
  const terms = resolveInviteTerms(template?.visibility ?? 'unlisted', params, DEFAULT_TTL_DAYS);
  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + terms.ttlDays * 24 * 3_600_000);
  await inviteRepo.create({
    roomSlug: params.slug,
    tokenHash: inviteRepo.hashToken(token),
    createdBy: params.userId,
    maxUses: terms.maxUses,
    expiresAt,
  });
  return { token, expiresAt };
};

/** Info-sheet access: a valid invite for this room (peeked, not consumed). */
export const validateInviteForRoom = async (slug: string, token: string): Promise<boolean> => {
  const invite = await inviteRepo.findValid(inviteRepo.hashToken(token));
  return invite !== null && invite.roomSlug === slug;
};

/** (invite, identity) pairs that already spent a use — a refresh/rejoin must not spend another. */
const REDEEMED_TTL_MS = 7 * 24 * 3_600_000;
const MAX_REDEEMED = 20_000;
const redeemed = new Map<string, number>();

const redemptionKeys = (tokenHash: string, identityKeys: string[]): string[] =>
  identityKeys.map((id) => `${tokenHash}|${id}`);

const rememberRedemption = (keys: string[], now: number): void => {
  for (const key of keys) {
    if (redeemed.size >= MAX_REDEEMED && !redeemed.has(key)) {
      for (const [k, until] of redeemed) if (until <= now) redeemed.delete(k);
      const oldest = redeemed.keys().next().value;
      if (redeemed.size >= MAX_REDEEMED && oldest !== undefined) redeemed.delete(oldest);
    }
    redeemed.set(key, now + REDEEMED_TTL_MS);
  }
};

/**
 * Join-time: spend one use — unless this gid/userId already spent one on this
 * invite. Callers peek (`validateInviteForRoom`) and check bans FIRST, so a
 * banned identity never burns a use. Every failure is `not_found`, the same
 * answer as a missing room: a distinct invite code would let anyone probe slugs.
 */
export const redeemInviteForJoin = async (
  slug: string,
  token: string,
  identityKeys: string[],
  consume: typeof inviteRepo.consume = inviteRepo.consume
): Promise<void> => {
  const tokenHash = inviteRepo.hashToken(token);
  const keys = redemptionKeys(tokenHash, identityKeys);
  const now = Date.now();
  if (keys.some((key) => (redeemed.get(key) ?? 0) > now)) return;
  const invite = await consume(tokenHash);
  if (!invite || invite.roomSlug !== slug) throw new AppError(404, ROOM_ERROR_CODES.NOT_FOUND);
  rememberRedemption(keys, now);
};

export const listInvites = async (slug: string, userId: string) => {
  const template = await roomRepo.findBySlug(slug);
  assertCanManageRoom(template, userId);
  return inviteRepo.listForRoom(slug);
};

export const revokeInvite = async (slug: string, id: string, userId: string): Promise<void> => {
  const template = await roomRepo.findBySlug(slug);
  assertCanManageRoom(template, userId);
  const revoked = await inviteRepo.revoke(id, slug);
  if (!revoked) throw new AppError(404, 'Invite not found');
};
