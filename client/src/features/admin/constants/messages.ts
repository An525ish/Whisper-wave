import type { AdminMessageStatusFilter } from '@/features/admin/types';

export { ADMIN_MIN_SEARCH_LEN } from './common';

export const MESSAGES_EMPTY_IMAGE = '/images/no-meme.svg';

export const MESSAGE_STATUS_TABS: { id: AdminMessageStatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'sent', label: 'Sent' },
  { id: 'failed', label: 'Failed' },
];
