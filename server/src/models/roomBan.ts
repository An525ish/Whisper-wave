import mongoose, { Schema, model, type Document } from 'mongoose';
import type { IRoomBanFields } from '../types/room.js';

export type IRoomBan = IRoomBanFields & Document;

/**
 * A ban from one room (`roomSlug`) or every room (`null` = global).
 *
 * Keyed by `gid` AND `userId` — the same dual-key rule as whisper blocks, so
 * signing in (or clearing cookies) cannot shed it while either identity is
 * known. Expiry is enforced by a TTL index on `until`, not by application
 * sweeps.
 */
const roomBanSchema = new Schema<IRoomBan>(
  {
    roomSlug: { type: String, default: null },
    gid: { type: String, default: null },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    until: { type: Date, required: true },
    reason: { type: String, required: true, maxlength: 280 },
    by: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

roomBanSchema.index({ until: 1 }, { expireAfterSeconds: 0 });
roomBanSchema.index({ roomSlug: 1, gid: 1 });
roomBanSchema.index({ roomSlug: 1, userId: 1 });

export const RoomBan =
  (mongoose.models.RoomBan as mongoose.Model<IRoomBan> | undefined) ||
  model<IRoomBan>('RoomBan', roomBanSchema);
