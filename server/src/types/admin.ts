import type { Types } from 'mongoose';
import type { UserAvatar } from './user.js';

export type AdminTokenPayload = {
  role: 'admin';
};

export type AdminStats = {
  users: number;
  groups: number;
  chats: number;
  messages: number;
  onlineUsers: number;
  pendingRequests: number;
  /** Last 7 days — newest last */
  newUsersSeries: number[];
  messagesSeries: number[];
  groupsSeries: number[];
  requestsSeries: number[];
  seriesLabels: string[];
};

export type AdminUserListItem = {
  _id: Types.ObjectId;
  name: string;
  username: string;
  avatar: UserAvatar;
  email?: string;
  bio?: string;
  lastSeen?: Date;
  createdAt: Date;
};

export type AdminUsersPage = {
  users: AdminUserListItem[];
  nextCursor: string | null;
  hasMore: boolean;
  /** Present on the first page only — avoids recounting on every cursor fetch */
  total?: number;
};

export type AdminLoginResult = {
  token: string;
};

export type AdminActivityUser = {
  _id: Types.ObjectId | string;
  name: string;
  username: string;
  avatar?: UserAvatar;
};

export type AdminActivityMessage = {
  _id: Types.ObjectId | string;
  content?: string;
  attachments?: unknown[];
  status?: string;
  createdAt?: Date;
  sender?: AdminActivityUser;
  chat?: { _id: Types.ObjectId | string; name?: string };
};

export type AdminActivitySignup = {
  _id: Types.ObjectId | string;
  name: string;
  username: string;
  avatar?: UserAvatar;
  createdAt: Date;
};

export type AdminActivityEvent =
  | { kind: 'message'; data: AdminActivityMessage; ts: number }
  | { kind: 'signup'; data: AdminActivitySignup; ts: number };

export type AdminActivityPresence = {
  onlineCount: number;
  onlineUsers: AdminActivityUser[];
};

export type AdminActivityEventsPage = {
  events: AdminActivityEvent[];
  nextCursor: string | null;
  hasMore: boolean;
};

export type AdminGroupListItem = {
  _id: Types.ObjectId;
  name: string;
  bio?: string;
  members?: Array<{
    _id: Types.ObjectId;
    name?: string;
    username?: string;
    avatar?: UserAvatar;
  }>;
  creator?: {
    _id: Types.ObjectId;
    name?: string;
    username?: string;
    avatar?: UserAvatar;
  };
  createdAt: Date;
};

export type AdminGroupsPage = {
  groups: AdminGroupListItem[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
};

export type AdminMessageListItem = {
  _id: Types.ObjectId;
  content?: string;
  status?: string;
  attachments?: unknown[];
  createdAt?: Date;
  sender?: {
    _id?: Types.ObjectId;
    name?: string;
    username?: string;
    avatar?: UserAvatar;
  };
  chat?: { _id?: Types.ObjectId; name?: string; groupChat?: boolean };
};

export type AdminMessagesPage = {
  messages: AdminMessageListItem[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
};

export type AdminAttachmentItem = {
  url: string;
  name: string;
  fileType: string;
  publicId?: string;
};

export type AdminAttachmentMessageRow = {
  _id: Types.ObjectId;
  content?: string;
  attachments: AdminAttachmentItem[];
  sender?: {
    _id?: Types.ObjectId;
    name?: string;
    username?: string;
    avatar?: UserAvatar;
  };
  chat?: { _id?: Types.ObjectId; name?: string; groupChat?: boolean };
  createdAt?: Date;
};

export type AdminAttachmentsPage = {
  messages: AdminAttachmentMessageRow[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
};

/** @deprecated Use presence + events endpoints */
export type AdminActivityFeed = {
  recentMessages: AdminActivityMessage[];
  recentSignups: AdminActivitySignup[];
  onlineCount: number;
  onlineUsers: AdminActivityUser[];
};
