import mongoose, { Schema, model, type Document } from 'mongoose';
import type { IRoomInviteFields } from '../types/roomAdmin.js';

export type IRoomInvite = IRoomInviteFields & Document;

/**
 * Invite links for unlisted rooms. An unlisted room is unreachable without
 * one (info 404s, joins refuse) — the slug alone, being user-chosen, is not
 * a secret. Single collection, hash-lookuped, usage-counted.
 */
const roomInviteSchema = new Schema<IRoomInvite>(
  {
    roomSlug: { type: String, required: true },
    tokenHash: { type: String, required: true, unique: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    maxUses: { type: Number, default: null },
    uses: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

roomInviteSchema.index({ roomSlug: 1, createdAt: -1 });
roomInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RoomInvite =
  (mongoose.models.RoomInvite as mongoose.Model<IRoomInvite> | undefined) ||
  model<IRoomInvite>('RoomInvite', roomInviteSchema);
