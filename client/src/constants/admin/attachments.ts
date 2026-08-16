import type { AttachmentKindFilter } from '@/types/admin';

/** Minimum query length before admin list search hits the API. */
export const ADMIN_MIN_SEARCH_LEN = 2;

export const ATTACHMENT_KIND_TABS: { id: AttachmentKindFilter; label: string }[] = [
  { id: 'all', label: 'All Media' },
  { id: 'images', label: 'Images' },
  { id: 'videos', label: 'Videos' },
  { id: 'gifs', label: 'GIFs' },
  { id: 'links', label: 'Links' },
  { id: 'docs', label: 'Docs' },
];

export const ATTACHMENT_LIST_CARD_CLASS =
  'group relative flex flex-col overflow-hidden rounded-2xl border border-border/45 bg-primary/15 p-3.5 transition duration-200 hover:border-blue/30 hover:bg-primary/28 hover:shadow-[0_10px_28px_rgba(0,0,0,0.14)]';
