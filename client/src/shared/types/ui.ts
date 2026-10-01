import type { ComponentType, ReactNode } from 'react';
import type { IconProps } from '@/shared/types/icon';
import type { User } from '@/shared/types/user';

export type DotsMenuItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  disabled?: boolean;
  /** @deprecated Prefer tone="danger" */
  danger?: boolean;
  tone?: 'default' | 'accent' | 'danger';
  dividerBefore?: boolean;
};

export type TabItem = {
  id: string | number;
  name: string;
  count?: number;
  icon?: ReactNode;
};

export type TabVariant = 'underline' | 'pills';

export type DropdownOption = {
  label: string;
  Icon?: ComponentType<IconProps>;
  handler: () => void;
};

export type CarouselMember = Pick<User, '_id' | 'name'> & {
  avatar?: string | null;
};

export type AvatarRingTone = 'silver' | 'green';

export type ConfirmationResult = {
  accept: boolean;
};

export type ConfirmationVariant = 'danger' | 'default';

export type ButtonVariant = 'primary' | 'danger' | 'outlineGreen' | 'outlineRed' | 'ghost';

/**
 * Per-message grouping flags for a chat thread, produced by
 * `groupMessages` (`shared/utils`) so every message list agrees on what a
 * "run" of messages from one sender is and which bubble draws the tail.
 *
 * `TKey` is the caller-chosen discriminant: `'me' | 'them'` for the anonymous
 * room, `sender._id` for the logged-in thread.
 */
export type MessageGroup<TKey> = {
  /** Discriminant of this message. */
  key: TKey;
  /** The previous message shares `key`, so this one is a continuation. */
  joinedAbove: boolean;
  /** The next message shares `key`, so this one is not the end of its run. */
  joinedBelow: boolean;
  /** Last message of its run — the only one that draws the tail. */
  isTail: boolean;
};
