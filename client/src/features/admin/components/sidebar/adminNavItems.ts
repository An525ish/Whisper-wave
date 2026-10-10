import type { ComponentType } from 'react';
import ActivityIcon from '@/shared/components/ui/icons/Activity';
import ChatIcon from '@/shared/components/ui/icons/Chat';
import CreateGroupIcon from '@/shared/components/ui/icons/CreateGroup';
import DashboardIcon from '@/shared/components/ui/icons/Dashboard';
import EyeIcon from '@/shared/components/ui/icons/Eye';
import GridAllIcon from '@/shared/components/ui/icons/GridAll';
import NotificationIcon from '@/shared/components/ui/icons/Notification';
import ImagesIcon from '@/shared/components/ui/icons/Images';
import MembersIcon from '@/shared/components/ui/icons/Members';
import type { IconProps } from '@/shared/types';

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
  { id: 'reports', to: '/admin/reports', label: 'Reports', icon: NotificationIcon },
  { id: 'audit', to: '/admin/audit', label: 'Audit', icon: EyeIcon },
  { id: 'rooms', to: '/admin/rooms', label: 'Rooms', icon: GridAllIcon },
  { id: 'media', to: '/admin/media', label: 'Media & Files', icon: ImagesIcon },
]);
