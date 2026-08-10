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
