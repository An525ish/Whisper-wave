import mongoose, { Schema, model, type Document } from 'mongoose';
import type { IRoomFields } from '../types/room.js';

export type IRoom = IRoomFields & Document;

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
    visibility: {
      type: String,
      enum: ['official', 'public', 'unlisted'],
      required: true,
    },
  },
  { timestamps: true }
);

roomSchema.index({ visibility: 1 });

export const Room =
  (mongoose.models.Room as mongoose.Model<IRoom> | undefined) ||
  model<IRoom>('Room', roomSchema);
