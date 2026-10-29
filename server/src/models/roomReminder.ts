import mongoose, { Schema, model } from 'mongoose';
import { ROOM_REMINDER_TTL_SECONDS } from '../constants/roomReminders.js';
import type { IRoomReminderFields } from '../types/roomReminder.js';

const roomReminderSchema = new Schema<IRoomReminderFields>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  slug: { type: String, required: true, lowercase: true, trim: true, index: true },
  createdAt: { type: Date, required: true, default: Date.now },
});

roomReminderSchema.index({ userId: 1, slug: 1 }, { unique: true });
// A reminder for a room that never opens again expires on its own.
roomReminderSchema.index({ createdAt: 1 }, { expireAfterSeconds: ROOM_REMINDER_TTL_SECONDS });

export const RoomReminder =
  (mongoose.models.RoomReminder as mongoose.Model<IRoomReminderFields> | undefined) ||
  model<IRoomReminderFields>('RoomReminder', roomReminderSchema);
