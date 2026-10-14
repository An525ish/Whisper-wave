import mongoose, { Schema, model, type Document } from 'mongoose';
import type { IRoomFields } from '../types/room.js';
import type { RoomAcceptanceFields } from '../types/roomAdmin.js';

export type IRoom = IRoomFields & RoomAcceptanceFields & Document;

const roomHoursSchema = new Schema(
  {
    days: { type: [Number], required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    tz: { type: String, required: true },
  },
  { _id: false }
);

/**
 * A room template: one topic, served as live instances when people arrive.
 *
 * Official rooms are curated by us; user rooms are created in-app (unlisted
 * until approved for the lobby). Instances themselves are in-process and never
 * stored — ephemerality is the product promise.
 */
const roomSchema = new Schema<IRoom>(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, maxlength: 60 },
    description: { type: String, required: true, maxlength: 280 },
    rules: { type: [String], default: [] },
    lang: { type: String, default: 'en' },
    official: { type: Boolean, default: false },
    hours: { type: roomHoursSchema, default: null },
    capSoft: { type: Number, default: 60 },
    capHard: { type: Number, default: 100 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    /** Wave Team accounts (official rooms) — granted the mod role on join. */
    mods: { type: [Schema.Types.ObjectId], ref: 'User', default: [] },
    /**
     * Lobby listing requested by the host (unlisted rooms only). The admin
     * approval queue reads this — without it, requests would be invisible.
     */
    listingRequestedAt: { type: Date, default: null },
    /** D4: who accepted the rules, when, and which version of the copy. */
    rulesAcceptedAt: { type: Date, default: null },
    rulesAcceptedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    rulesVersion: { type: Number, default: null },
    /** Listening room (Venting): strict automod; posting pauses with no mod seated. */
    requiresModPresence: { type: Boolean, default: false },
    visibility: {
      type: String,
      enum: ['official', 'public', 'unlisted', 'private'],
      required: true,
    },
    /** Private rooms: idle-expiry deadline, refreshed on activity. Purged by `purgeIdlePrivateRooms` (not a TTL index — invites must go with the room). */
    expireAt: { type: Date, default: null },
  },
  { timestamps: true }
);

roomSchema.index({ visibility: 1 });
roomSchema.index({ createdBy: 1, visibility: 1 });
// Sparse-by-partial: only private rooms carry an expiry, so the purge scan stays tiny.
roomSchema.index({ expireAt: 1 }, { partialFilterExpression: { visibility: 'private' } });

export const Room =
  (mongoose.models.Room as mongoose.Model<IRoom> | undefined) ||
  model<IRoom>('Room', roomSchema);
