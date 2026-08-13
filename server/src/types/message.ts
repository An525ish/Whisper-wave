import type { Types } from 'mongoose';

export type MessageAttachment = {
  publicId: string;
  url: string;
  name: string;
  fileType: string;
};

/** Snapshot of the message being replied to (kept if original is deleted). */
export type MessageReplyTo = {
  messageId: Types.ObjectId;
  content?: string;
  senderName: string;
  previewAttachment?: {
    url: string;
    name: string;
    fileType: string;
  };
};

export type IMessageFields = {
  _id: Types.ObjectId;
  content?: string;
  attachments: MessageAttachment[];
  sender: Types.ObjectId;
  chat: Types.ObjectId;
  status: 'sent' | 'failed';
  /** Users who have read this message (connected receipts). */
  readBy: Types.ObjectId[];
  isDeleted?: boolean;
  editedAt?: Date;
  replyTo?: MessageReplyTo;
  createdAt: Date;
  updatedAt: Date;
};

export type UploadableFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  fileType?: string;
};

export type CloudinaryUploadResult = {
  publicId: string;
  url: string;
  name: string;
  fileType: string;
};

export type MessageListItem = {
  chat: unknown;
  sender: {
    _id: unknown;
    name: string;
    avatar: string;
  };
  [key: string]: unknown;
};

export type CreateMessageInput = {
  content?: string;
  attachments?: MessageAttachment[];
  sender: string | Types.ObjectId;
  chat: string | Types.ObjectId;
  status?: 'sent' | 'failed';
  replyTo?: MessageReplyTo;
};

export type MessageRecord = {
  _id: Types.ObjectId;
  content?: string;
  attachments: MessageAttachment[];
  sender: Types.ObjectId;
  chat: Types.ObjectId;
  status: 'sent' | 'failed';
  readBy: Types.ObjectId[];
  isDeleted?: boolean;
  editedAt?: Date;
  replyTo?: MessageReplyTo;
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateMessagePatch = Partial<{
  content: string;
  attachments: MessageAttachment[];
  status: 'sent' | 'failed';
  readBy: Types.ObjectId[];
  isDeleted: boolean;
  editedAt: Date;
}>;
