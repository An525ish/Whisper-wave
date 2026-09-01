// ── from features/chat/constants/scroll.ts ──────────────────────────────
/** Distance from bottom (px) below which the view is considered "near bottom". */
export const NEAR_BOTTOM_PX = 120;

/** Debounce delay (ms) for user-search inputs. */
export const SEARCH_DEBOUNCE_MS = 450;

/** Max auto-grow height (px) for the chat composer textarea. */
export const MAX_TEXTAREA_HEIGHT = 128;

/** Composer row + send button sizing (input pill border adds 2px to outer height). */
export const COMPOSER_ROW_MIN_PX = 44;
export const COMPOSER_ROW_MIN_PX_COMPACT = 32;
export const COMPOSER_ROW_MIN_CLASS = 'min-h-11';
export const COMPOSER_ROW_MIN_CLASS_COMPACT = 'min-h-8';
export const COMPOSER_SEND_SIZE_CLASS = 'size-[calc(2.75rem+2px)]';
export const COMPOSER_SEND_SIZE_CLASS_COMPACT = 'size-[calc(2rem+2px)]';

/** Clearance for the floating conversation header (matches Chat.tsx fade). */
export const CHAT_HEADER_OFFSET_CLASS =
  'pt-[calc(max(0.5rem,env(safe-area-inset-top))+5.25rem)] md:pt-[calc(0.25rem+7rem)]';

export const CHAT_HEADER_TOP_CLASS =
  'top-[calc(max(0.5rem,env(safe-area-inset-top))+5.25rem)] md:top-[calc(0.25rem+7rem)]';

export const CHAT_HEADER_FADE_CLASS =
  'h-[calc(max(0.5rem,env(safe-area-inset-top))+5.25rem)] md:h-28';

/** Compact link preview width — composer strip + message bubble cards. */
export const LINK_PREVIEW_WIDTH_CLASS = 'w-[15rem] max-w-full';


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
