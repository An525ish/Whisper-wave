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

export type PushFirebaseConfig = {
  apiKey: string;
  projectId: string;
  appId: string;
  messagingSenderId: string;
};

/** `GET /api/push/config` — public; `enabled: false` when the server has no FCM creds. */
export type PushConfig =
  | { enabled: false }
  | { enabled: true; firebase: PushFirebaseConfig; vapidKey: string };

export type EnabledPushConfig = Extract<PushConfig, { enabled: true }>;

export type PushPermission = 'default' | 'granted' | 'denied';

/** Browser facts the toggle depends on, read once from the platform. */
export type PushEnvironment = {
  supported: boolean;
  permission: PushPermission;
  /** iOS Safari tab: web push only works once installed to the Home Screen. */
  iosNeedsInstall: boolean;
};

export type PushSnapshot = PushEnvironment & { hasToken: boolean };

export type PushUiState = 'hidden' | 'install' | 'unsupported' | 'denied' | 'off' | 'on';
