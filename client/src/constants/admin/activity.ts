import type { AdminActivityFilter } from '@/types/admin';

export const ACTIVITY_FILTER_TABS: { id: AdminActivityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'messages', label: 'Messages' },
  { id: 'signups', label: 'Signups' },
];

export const ACTIVITY_EMPTY_IMAGE = '/images/no-notification.svg';
