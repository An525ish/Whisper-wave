import type { User, ApiSuccess, IconProps } from '@/shared/types';
import type { ComponentType } from 'react';

export type AdminMeResponse = ApiSuccess & { isAdmin: boolean };

export type AdminUser = User & {
  createdAt?: string;
  friendsCount?: number;
  groupsCount?: number;
};

export type AdminMessage = {
  _id: string;
  content?: string;
  sender: { _id: string; name?: string };
  chat?: string;
  createdAt?: string;
  attachments?: unknown[];
};

export type AdminGroup = {
  _id: string;
  name: string;
  groupChat: boolean;
  members?: { _id: string; name?: string }[];
  creator?: { _id: string; name?: string };
  createdAt?: string;
  totalMessages?: number;
};

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
  createdAt?: string;
};

export type AdminGroupRow = {
  _id: string;
  name?: string;
  members?: unknown[];
  creator?: { name?: string };
  createdAt?: string;
};

export type AdminMessageRow = {
  _id: string;
  content?: string;
  status?: string;
  createdAt?: string;
  attachments?: unknown[];
  sender?: {
    name?: string;
    username?: string;
    avatar?: { url?: string };
  };
  chat?: { name?: string };
};
