// ── from features/chat/constants/scroll.ts ──────────────────────────────
/** Distance from bottom (px) below which the view is considered "near bottom". */
export const NEAR_BOTTOM_PX = 120;


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
import type { NewConnectTab } from '../types/chat';

type NewConnectTabConfig = {
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
import type { SearchMode } from '../types/chat';

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

export const CONVERSATION_HEADER_SHELL_CLASS =
  'absolute inset-x-2 top-[max(0.5rem,env(safe-area-inset-top))] z-30 w-auto md:left-2 md:right-2 md:top-0';

export const CONVERSATION_HEADER_INNER_CLASS =
  'rounded-xl border border-white/10 bg-[rgba(33,26,42,0.48)] px-2 py-1.5 pl-1.5 pr-3 shadow-[0_10px_28px_rgba(0,0,0,0.24)] backdrop-blur-xl lg:pl-2.5 lg:pr-5';
