import mongoose, { Schema, model, type Document } from 'mongoose';
import type {
  IMessageFields,
  MessageAttachment,
  MessageReplyTo,
} from '../types/message.js';

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

const replyToSchema = new Schema<MessageReplyTo>(
  {
    messageId: { type: Schema.Types.ObjectId, required: true },
    content: { type: String },
    senderName: { type: String, required: true },
    previewAttachment: {
      url: { type: String },
      name: { type: String },
      fileType: { type: String },
    },
  },
  { _id: false }
);

const messageSchema = new Schema<IMessage>(
  {
    content: { type: String },
    attachments: [attachmentSchema],
    replyTo: { type: replyToSchema },
    sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    chat: { type: Schema.Types.ObjectId, ref: 'Chat', required: true },
    status: {
      type: String,
      enum: ['sent', 'failed'],
      default: 'sent',
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isDeleted: { type: Boolean, default: false },
    editedAt: { type: Date },
  },
  { timestamps: true }
);

// Primary pagination + count queries (status/isDeleted filters applied after index scan without these)
messageSchema.index({ chat: 1, status: 1, createdAt: -1 });
// Per-sender queries (edit, delete, context)
messageSchema.index({ chat: 1, sender: 1, createdAt: -1 });
// markReadByUser updateMany: chat + sender≠ + createdAt range
messageSchema.index({ chat: 1, createdAt: -1 });

export const Message =
  (mongoose.models.Message as mongoose.Model<IMessage> | undefined) ||
  model<IMessage>('Message', messageSchema);
