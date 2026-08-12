import mongoose, { Schema, model, type Document } from 'mongoose';
import type { IMessageFields, MessageAttachment } from '../types/message.js';

export type IMessage = IMessageFields & Document;

const attachmentSchema = new Schema<MessageAttachment>(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
    name: { type: String, required: true },
    fileType: { type: String, required: true },
  },
  { _id: false }
);

const messageSchema = new Schema<IMessage>(
  {
    content: { type: String },
    attachments: [attachmentSchema],
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent',
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ chat: 1, sender: 1, createdAt: -1 });

export const Message =
  (mongoose.models.Message as mongoose.Model<IMessage> | undefined) ||
  model<IMessage>('Message', messageSchema);
