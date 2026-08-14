import type { ComponentType, ReactNode } from 'react';
import type { IconProps } from '@/types/icon';
import type { User } from '@/types/user';

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
