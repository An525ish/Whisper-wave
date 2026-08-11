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
  /** Last 7 days — newest last */
  newUsersSeries: number[];
  messagesSeries: number[];
  seriesLabels: string[];
};

export type AdminUserListItem = {
  _id: Types.ObjectId;
  name: string;
  username: string;
  avatar: UserAvatar;
  createdAt: Date;
};

export type AdminLoginResult = {
  token: string;
};
