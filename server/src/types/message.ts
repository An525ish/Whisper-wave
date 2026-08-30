import type { Types } from 'mongoose';
import type { RealtimeNotify } from './chat.js';

export type MessageAttachment = {
  publicId: string;
  url: string;
  name: string;
  fileType: string;
};

export type UploadableFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  fileType?: string;
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

/** Client-safe reply snapshot (`messageId` as string). */
export type MessageReplyToClient = {
  messageId: string;
  content?: string;
  senderName: string;
  previewAttachment?: {
    url: string;
    name: string;
    fileType: string;
  };
};

export type PersistTextMessageInput = {
  userId: string;
  chatId: string;
  content: string;
  replyToMessageId?: string;
};

export type PersistTextMessageResult =
  | {
      ok: true;
      messageId: string;
      createdAt: string;
      replyTo?: MessageReplyTo;
    }
  | { ok: false };

export type SearchMessagesOptions = {
  scope?: 'all' | 'text' | 'media' | 'links';
  from?: 'anyone' | 'me' | 'others';
  senderId?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
};

export type SendAttachmentsInput = {
  userId: string;
  chatId: string;
  /** Pre-verified attachments already uploaded directly to Cloudinary by the client. */
  attachments: import('./upload.js').CommitAttachment[];
  content?: string;
  replyToMessageId?: string;
};

export type SendGifInput = {
  userId: string;
  chatId: string;
  gifId: string;
  gifUrl: string;
  gifTitle: string;
  replyToMessageId?: string;
  mimeType?: string;
  kind?: 'gif' | 'meme';
};

export type GetMessagesInput = {
  userId: string;
  chatId: string;
  page: number;
};

export type GetMessageContextInput = {
  userId: string;
  chatId: string;
  messageId: string;
};

export type SearchMessagesInput = {
  userId: string;
  chatId: string;
  query: string;
  options?: SearchMessagesOptions;
};

export type JumpToDateInput = {
  userId: string;
  chatId: string;
  dateFromIso: string;
  dateToIso?: string;
};

export type ListActiveDatesInput = {
  userId: string;
  chatId: string;
  dateFromIso: string;
  dateToIso: string;
  timeZone: string;
};

export type EditMessageInput = {
  userId: string;
  messageId: string;
  content: string;
};

export type DeleteMessageInput = {
  userId: string;
  messageId: string;
};

export type DeleteManyMessagesInput = {
  userId: string;
  chatId: string;
  messageIds: string[];
};

export type ClearChatMessagesInput = {
  userId: string;
  chatId: string;
};

export type ForwardMessagesInput = {
  userId: string;
  sourceChatId: string;
  targetChatId: string;
  messageIds: string[];
};

export type MessageSenderClient = {
  _id: string;
  name: string;
  avatar: string;
};

export type MessageForClient = {
  _id: string;
  content?: string;
  attachments: MessageAttachment[];
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  editedAt?: string;
  replyTo?: MessageReplyToClient;
  sender: MessageSenderClient;
  readBy: string[];
};

/** Populated sender from a lean message query (before client mapping). */
export type MessagePopulatedSender = {
  _id: unknown;
  name?: string;
  avatar?: string | { url?: string };
};

/** HTTP send response — mongoose doc fields plus sender overlay. */
export type SentMessagePayload = {
  _id: Types.ObjectId | string;
  content?: string;
  attachments?: MessageAttachment[];
  chat?: Types.ObjectId | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  replyTo?: MessageReplyTo;
  sender: MessageSenderClient;
};

export type SendMessageResult = {
  data: SentMessagePayload;
  notifications: RealtimeNotify[];
};

export type EditMessageResult = {
  data: MessageForClient;
  notifications: RealtimeNotify[];
};

export type DeleteMessagesResult = {
  messageIds: string[];
  notifications: RealtimeNotify[];
};

export type GetMessagesResult = {
  groupChat: boolean;
  data: MessageListItem[];
  totalPages: number;
};

export type GetMessageContextResult = {
  data: MessageListItem[];
  page: number;
  totalPages: number;
};

export type SearchMessageHit = {
  _id: string;
  content?: string;
  attachments?: Array<{ name?: string; fileType?: string; url?: string }>;
  createdAt: string;
  sender: MessageSenderClient;
};

export type SearchMessagesResult = {
  data: SearchMessageHit[];
  total: number;
};

export type JumpToDateResult = {
  _id: string;
  createdAt: string;
  exactDay: boolean;
};

export type ListActiveDatesResult = {
  dates: string[];
  minYear: number | null;
};

export type MessageReceiptUser = {
  _id: string;
  name: string;
  avatar?: { url?: string };
};

export type FindReceiptsResult = {
  readers: MessageReceiptUser[];
  isMember: boolean;
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


export type MessageListItem = {
  chat: string;
  sender: MessageSenderClient;
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
