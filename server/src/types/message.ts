import type { Types } from 'mongoose';

export type MessageAttachment = {
  publicId: string;
  url: string;
  name: string;
  fileType: string;
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
};

export type MessageRecord = {
  _id: Types.ObjectId;
  content?: string;
  attachments: MessageAttachment[];
  sender: Types.ObjectId;
  chat: Types.ObjectId;
  status: 'sent' | 'failed';
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

export type UpdateMessagePatch = Partial<{
  content: string;
  attachments: MessageAttachment[];
  status: 'sent' | 'failed';
  readBy: Types.ObjectId[];
}>;
