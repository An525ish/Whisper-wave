import type { Types } from 'mongoose';

export type LastMessageType =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'location'
  | 'media';

export type ChatLastMessage = {
  _id?: Types.ObjectId;
  content?: string;
  sender?: Types.ObjectId;
  type?: LastMessageType;
  createdAt?: Date;
};

export type IChatFields = {
  _id: Types.ObjectId;
  name: string;
  groupChat: boolean;
  creator: Types.ObjectId;
  members: Types.ObjectId[];
  lastMessage?: ChatLastMessage;
  createdAt: Date;
  updatedAt: Date;
};

export type PopulatedMember = {
  _id: { toString(): string };
  name: string;
  avatar?: { url?: string };
};

export type ChatListItem = {
  _id: unknown;
  groupChat: boolean;
  name: string;
  avatar: Array<string | undefined>;
  members: Array<{ toString(): string }>;
  lastMessage: unknown;
};

export type FindChatItem = {
  _id: unknown;
  groupChat: boolean;
  name: string;
  avatar: string[] | null;
  notificationCount: number;
};

export type ChatNotificationInput = {
  chatId: string;
  count: number;
};

export type RealtimeNotify = {
  event: string;
  members: Array<string | { toString(): string }>;
  data?: unknown;
};
