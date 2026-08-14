// ── from features/chat/constants/scroll.ts ──────────────────────────────
/** Distance from bottom (px) below which the view is considered "near bottom". */
export const NEAR_BOTTOM_PX = 120;

/** Debounce delay (ms) for user-search inputs. */
export const SEARCH_DEBOUNCE_MS = 450;

/** Max auto-grow height (px) for the chat composer textarea. */
export const MAX_TEXTAREA_HEIGHT = 128;


// ── from features/chat/constants/tabs.ts ──────────────────────────────
import type { NewConnectTab } from '@/types/chat';

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


// ── from features/chat/constants/searchConfig.ts ──────────────────────────────
import type { SearchMode } from '@/types/chat';

export type SearchModeConfig = {
  id: SearchMode;
  label: string;
  hint: string;
};

export type DatePreset = {
  id: string;
  label: string;
  daysAgo: number;
};

export const SEARCH_MODES: SearchModeConfig[] = [
  { id: 'messages', label: 'Text',  hint: 'Words & phrases' },
  { id: 'media',    label: 'Media', hint: 'Photos & files'  },
  { id: 'links',    label: 'Links', hint: 'Shared URLs'     },
  { id: 'date',     label: 'Date',  hint: 'Jump to a day'   },
];

export const DATE_PRESETS: readonly DatePreset[] = [
  { id: 'today',     label: 'Today',   daysAgo: 0  },
  { id: 'yesterday', label: 'Yesterday', daysAgo: 1 },
  { id: 'week',      label: '7d ago',  daysAgo: 7  },
  { id: 'month',     label: '30d ago', daysAgo: 30 },
] as const;

export const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as const;
