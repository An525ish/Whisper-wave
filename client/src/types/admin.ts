import type { User, ApiSuccess, IconProps } from '@/types';
import type { ComponentType } from 'react';
import type { AttachmentKind } from '@/utils/fileFormat';

export type AdminMeResponse = ApiSuccess & { isAdmin: boolean };

export type AdminUser = User & {
  createdAt?: string;
  friendsCount?: number;
  groupsCount?: number;
};

export type AdminMessage = {
  _id: string;
  content?: string;
  status?: string;
  sender?: { _id: string; name?: string; username?: string; avatar?: { url?: string } };
  chat?: { _id: string; name?: string };
  createdAt?: string;
  attachments?: unknown[];
};

export type AdminGroup = {
  _id: string;
  name: string;
  bio?: string;
  groupChat: boolean;
  members?: { _id: string; name?: string; username?: string; avatar?: { url?: string } }[];
  creator?: { _id: string; name?: string; username?: string; avatar?: { url?: string } };
  createdAt?: string;
  totalMessages?: number;
};

export type AdminStats = {
  users: number;
  groups: number;
  chats: number;
  messages: number;
  onlineUsers: number;
  pendingRequests: number;
  newUsersSeries: number[];
  messagesSeries: number[];
  groupsSeries: number[];
  requestsSeries: number[];
  seriesLabels: string[];
};

export type AdminActivityUser = {
  _id: string;
  name: string;
  username: string;
  avatar?: { url?: string };
};

export type AdminActivityMessage = {
  _id: string;
  content?: string;
  attachments?: unknown[];
  status?: string;
  createdAt?: string;
  sender?: AdminActivityUser;
  chat?: { _id: string; name?: string };
};

export type AdminActivitySignup = {
  _id: string;
  name: string;
  username: string;
  avatar?: { url?: string };
  createdAt: string;
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

export type AdminUsersPage = {
  users: AdminUserRow[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
};

export type AdminGroupsPage = {
  groups: AdminGroupRow[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
};

export type AdminMessagesPage = {
  messages: AdminMessageRow[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
};

export type AdminActivityFilter = 'all' | 'messages' | 'signups' | 'admin-logs';

export type TitleStat = {
  title: string;
  Icon: ComponentType<IconProps>;
  value: number | string;
  online?: boolean;
};

export type AdminUserRow = {
  _id: string;
  name?: string;
  username?: string;
  avatar?: { url?: string };
  bio?: string;
  email?: string;
  lastSeen?: string;
  createdAt?: string;
};

export type UserFilterOption = Pick<AdminUserRow, '_id' | 'name' | 'username'> & {
  avatarUrl?: string;
};

export type AdminGroupRow = {
  _id: string;
  name?: string;
  bio?: string;
  members?: AdminGroupMember[];
  creator?: AdminGroupMember;
  createdAt?: string;
};

export type AdminGroupMember = {
  _id: string;
  name?: string;
  username?: string;
  avatar?: { url?: string };
};

export type AdminMessageAttachment = {
  url: string;
  name: string;
  fileType: string;
  publicId?: string;
};

export type AttachmentKindFilter = 'all' | 'images' | 'videos' | 'gifs' | 'links' | 'docs';

export type AdminAttachmentRow = {
  _id: string;
  content?: string;
  attachments: AdminMessageAttachment[];
  sender?: { _id?: string; name?: string; username?: string; avatar?: { url?: string } };
  chat?: { _id?: string; name?: string; groupChat?: boolean };
  createdAt?: string;
};

export type AdminAttachmentsPage = {
  messages: AdminAttachmentRow[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
};

export type AdminMessageRow = {
  _id: string;
  content?: string;
  status?: string;
  createdAt?: string;
  attachments?: AdminMessageAttachment[];
  sender?: {
    name?: string;
    username?: string;
    avatar?: { url?: string };
  };
  chat?: { _id?: string; name?: string };
};

export type AdminMessageStatusFilter = 'all' | 'sent' | 'failed';

export type FlatItem = {
  key: string;
  att: AdminMessageAttachment;
  msg: AdminAttachmentRow;
  rk: AttachmentKind;
};

export type LinkItem = {
  key: string;
  url: string;
  msg: AdminAttachmentRow;
};

export type AdminActivityEventGroup = {
  label: string;
  events: AdminActivityEvent[];
};

export type DashboardMetricKey = 'users' | 'groups' | 'online' | 'messages' | 'pending';

export type DashboardMetric = {
  key: DashboardMetricKey;
  label: string;
  value: string;
  accent: string;
  hint: string;
};

export type DashboardCompositionSegment = {
  label: string;
  value: number;
  glow: string;
};

export type AdminImpersonationLogEntry = {
  _id: string;
  adminId: string;
  targetUserId: string;
  targetUsername: string;
  targetName: string;
  startedAt: string;
};

export type AdminImpersonationLogsPage = {
  logs: AdminImpersonationLogEntry[];
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
};
