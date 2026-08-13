import mongoose, { Schema, model, type Document } from 'mongoose';
import type { ChatLastMessage, IChatFields } from '../types/chat.js';

export type IChat = IChatFields & Document;

const lastMessageSchema = new Schema<ChatLastMessage>(
  {
    _id: { type: Schema.Types.ObjectId, ref: 'Message' },
    content: { type: String },
    sender: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'audio', 'document', 'location', 'media'],
    },
    createdAt: { type: Date },
  },
  { _id: false }
);

const chatAvatarSchema = new Schema(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const chatSchema = new Schema<IChat>(
  {
    name: { type: String, required: true },
    bio: { type: String, maxlength: 70 },
    avatar: { type: chatAvatarSchema },
    groupChat: { type: Boolean, default: false },
    creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: { type: lastMessageSchema },
  },
  { timestamps: true }
);

export const Chat =
  (mongoose.models.Chat as mongoose.Model<IChat> | undefined) ||
  model<IChat>('Chat', chatSchema);
