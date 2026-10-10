import type { Types } from 'mongoose';
import { RoomBan } from '../models/roomBan.js';
import type { IRoomBanFields } from '../types/room.js';

type RoomBanLean = IRoomBanFields & { _id: Types.ObjectId };

/**
 * Ban an identity from one room (`roomSlug`) or all rooms (`null`).
 * `minutes` bounds every ban — even a "permanent" one is a long expiry, so no
 * row outlives its purpose if the unban path is never reached.
 */
export const ban = async (params: {
  roomSlug: string | null;
  gid?: string | null;
  userId?: Types.ObjectId | string | null;
  minutes: number;
  reason: string;
  by: string;
}): Promise<RoomBanLean> => {
  const doc = await RoomBan.create({
    roomSlug: params.roomSlug,
    gid: params.gid ?? null,
    userId: params.userId ?? null,
    until: new Date(Date.now() + params.minutes * 60 * 1000),
    reason: params.reason,
    by: params.by,
  });
  return doc.toObject() as unknown as RoomBanLean;
};

export const liftBan = async (id: string): Promise<boolean> => {
  const res = await RoomBan.deleteOne({ _id: id });
  return res.deletedCount > 0;
};

/** Newest first — the admin bans list. Cap keeps the admin read bounded. */
export const listBans = async (limit = 100): Promise<RoomBanLean[]> =>
  RoomBan.find({}).sort({ createdAt: -1 }).limit(limit).lean<RoomBanLean[]>();

/**
 * Live bans for an identity: room-scoped plus global. One query — checked on
 * every room join, so it stays a single indexed read.
 */
export const findLiveBans = async (params: {
  gid?: string | null;
  userId?: Types.ObjectId | string | null;
}): Promise<RoomBanLean[]> => {
  const ors: Record<string, unknown>[] = [];
  if (params.gid) ors.push({ gid: params.gid });
  if (params.userId) ors.push({ userId: params.userId });
  if (ors.length === 0) return [];
  return RoomBan.find({ until: { $gt: new Date() }, $or: ors }).lean<RoomBanLean[]>();
};
