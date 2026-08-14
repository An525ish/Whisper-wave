import type { ReactNode } from 'react';
import type { User } from '@/types/user';

export type {
  Avatar,
  User,
  ApiSuccess,
  MessageNotification,
  RequestNotification,
  AdminStats,
} from '@/types/user';
export type { IconProps } from '@/types/icon';

export type SidebarContextValue = {
  expanded: boolean;
};

export type FriendSuggestion = Pick<User, '_id' | 'name'> & {
  avatar?: string | null;
  isRequested?: boolean;
};

export type SuggestionMember = Pick<User, '_id' | 'name'> & {
  avatar?: string | null;
};

export type ContextMenuPosition = {
  x: number;
  y: number;
};

export type ContextMenuOption = {
  icon: string | ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
};

export type ContextMenuState = {
  visible: boolean;
  position: ContextMenuPosition;
  options: ContextMenuOption[];
};

export type ErrorEntry = {
  isError?: boolean;
  error?: unknown;
  fallback?: () => void;
} & Record<string, unknown>;

export type SharedMediaRow = {
  _id?: string;
  publicId?: string;
  name?: string;
  url?: string;
  fileType?: string;
};
