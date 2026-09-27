import type { AdminActivityFilter } from '@/features/admin/types';

export const ACTIVITY_FILTER_TABS: { id: AdminActivityFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'messages', label: 'Messages' },
  { id: 'signups', label: 'Signups' },
  { id: 'admin-logs', label: 'Admin Logs' },
];

export const ACTIVITY_EMPTY_IMAGE = '/images/no-notification.svg';
