import { randomBytes } from 'node:crypto';
import { AppError } from '../../utils/AppError.js';
import { ROOM_ERROR_CODES } from '../../constants/room-events.js';
import * as roomRepo from '../../repositories/room.js';
import * as inviteRepo from '../../repositories/roomInvite.js';
import { assertCanManageRoom } from './membership.js';

const DEFAULT_TTL_DAYS = 7;

export const createInvite = async (params: {
  slug: string;
  userId: string;
  maxUses?: number | null;
  ttlDays?: number;
}): Promise<{ token: string; expiresAt: Date }> => {
  const template = await roomRepo.findBySlug(params.slug);
  assertCanManageRoom(template, params.userId);
  const token = randomBytes(24).toString('base64url');
  const expiresAt = new Date(Date.now() + (params.ttlDays ?? DEFAULT_TTL_DAYS) * 24 * 3_600_000);
  await inviteRepo.create({
    roomSlug: params.slug,
    tokenHash: inviteRepo.hashToken(token),
    createdBy: params.userId,
    maxUses: params.maxUses ?? null,
    expiresAt,
  });
  return { token, expiresAt };
};

/** Info-sheet access: a valid invite for this room (peeked, not consumed). */
export const validateInviteForRoom = async (slug: string, token: string): Promise<boolean> => {
  const invite = await inviteRepo.findValid(inviteRepo.hashToken(token));
  return invite !== null && invite.roomSlug === slug;
};

/** Join-time: consume one use. Returns the room slug or throws 403. */
export const consumeInviteForJoin = async (slug: string, token: string): Promise<void> => {
  const invite = await inviteRepo.consume(inviteRepo.hashToken(token));
  if (!invite || invite.roomSlug !== slug) {
    // Stable code (not prose): the client branches on it.
    throw new AppError(403, ROOM_ERROR_CODES.INVITE_INVALID);
  }
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
