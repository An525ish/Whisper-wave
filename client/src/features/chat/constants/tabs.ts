import type { NewConnectTab } from '@/features/chat/types';

export type NewConnectTabConfig = {
  id: NewConnectTab;
  label: string;
  title: string;
  hint: string;
};

export const NEW_CONNECT_TABS: NewConnectTabConfig[] = [
  {
    id: 'friends',
    label: 'Friends',
    title: 'Find people',
    hint: 'Search and send a friend request',
  },
  {
    id: 'group',
    label: 'Group',
    title: 'Build a group',
    hint: 'Add a name, photo, and members',
  },
];
