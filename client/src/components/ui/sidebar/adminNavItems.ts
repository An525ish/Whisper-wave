import type { ComponentType } from 'react';
import ActivityIcon from '@/components/ui/icons/Activity';
import ChatIcon from '@/components/ui/icons/Chat';
import CreateGroupIcon from '@/components/ui/icons/CreateGroup';
import DashboardIcon from '@/components/ui/icons/Dashboard';
import ImagesIcon from '@/components/ui/icons/Images';
import MembersIcon from '@/components/ui/icons/Members';
import type { IconProps } from '@/types';

export type AdminNavItem = {
  id: string;
  to: string;
  label: string;
  icon: ComponentType<IconProps>;
};

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = Object.freeze([
  { id: 'dashboard', to: '/admin/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { id: 'activity', to: '/admin/activity', label: 'Activity', icon: ActivityIcon },
  { id: 'users', to: '/admin/users', label: 'Users', icon: MembersIcon },
  { id: 'groups', to: '/admin/groups', label: 'Groups', icon: CreateGroupIcon },
  { id: 'messages', to: '/admin/messages', label: 'Messages', icon: ChatIcon },
  { id: 'media', to: '/admin/media', label: 'Media & Files', icon: ImagesIcon },
]);
