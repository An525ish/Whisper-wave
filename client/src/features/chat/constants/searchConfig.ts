import type { SearchMode } from '@/features/chat/types';

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
