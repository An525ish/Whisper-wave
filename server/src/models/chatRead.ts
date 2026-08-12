import mongoose, { Schema, model, type Document } from 'mongoose';
import type { IChatReadFields } from '../types/chat.js';

export type IChatRead = IChatReadFields & Document;

const chatReadSchema = new Schema<IChatRead>(
  {
    chat: {
      type: Schema.Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastReadAt: { type: Date, required: true },
    lastReadMessageId: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  { timestamps: true }
);

chatReadSchema.index({ chat: 1, user: 1 }, { unique: true });

export const ChatRead =
  (mongoose.models.ChatRead as mongoose.Model<IChatRead> | undefined) ||
  model<IChatRead>('ChatRead', chatReadSchema);
