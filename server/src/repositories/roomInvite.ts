import { createHash } from 'node:crypto';
import { RoomInvite } from '../models/roomInvite.js';
import type { IRoomInviteFields } from '../models/roomInvite.js';

type RoomInviteLean = IRoomInviteFields & { _id: unknown };

export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const create = async (params: {
  roomSlug: string;
  tokenHash: string;
  createdBy: string;
  maxUses: number | null;
  expiresAt: Date;
}): Promise<RoomInviteLean> => {
  const doc = await RoomInvite.create({ ...params, uses: 0, revoked: false });
  return doc.toObject() as unknown as RoomInviteLean;
};

/**
 * Atomically consume one use: valid, unrevoked, unexpired, under cap.
 * Returns the invite or null — a single query, so concurrent joins can't
 * overshoot maxUses.
 */
export const consume = async (tokenHash: string): Promise<RoomInviteLean | null> =>
  RoomInvite.findOneAndUpdate(
    {
      tokenHash,
      revoked: false,
      expiresAt: { $gt: new Date() },
      $or: [{ maxUses: null }, { $expr: { $lt: ['$uses', '$maxUses'] } }],
    },
    { $inc: { uses: 1 } },
    { new: true }
  ).lean<RoomInviteLean | null>();

/** Peek without consuming (info sheet, validation). */
export const findValid = async (tokenHash: string): Promise<RoomInviteLean | null> =>
  RoomInvite.findOne({
    tokenHash,
    revoked: false,
    expiresAt: { $gt: new Date() },
  }).lean<RoomInviteLean | null>();

export const listForRoom = async (roomSlug: string): Promise<RoomInviteLean[]> =>
  RoomInvite.find({ roomSlug }).sort({ createdAt: -1 }).limit(50).lean<RoomInviteLean[]>();

export const revoke = async (id: string, roomSlug: string): Promise<boolean> => {
  const res = await RoomInvite.updateOne({ _id: id, roomSlug }, { $set: { revoked: true } });
  return res.modifiedCount > 0;
};
