import type { Avatar } from '@/shared/types';

export type MessageNotifyItem = {
  id: string;
  name?: string;
  avatar?: string | null;
  count?: number;
  timestamp?: string | number;
};

export type FriendRequestNotify = {
  _id: string;
  createdAt?: string;
  sender: {
    name?: string;
    avatar?: string | Avatar;
  };
};

export type FriendRequestNotifyItemProps = {
  notification: FriendRequestNotify;
};

export type FoundChatNotification = {
  _id: string;
  name?: string;
  avatar?: string[];
  notificationCount?: number;
  timestamp?: string | number;
};

export type FriendRequestRow = {
  id?: string;
  _id: string;
  createdAt?: string;
  sender: {
    name?: string;
    avatar?: string;
  };
};

export type NotificationsResponse = {
  data?: FriendRequestRow[];
};
