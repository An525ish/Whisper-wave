import type { MemeCategoryChip, MemeFloater, MemeReportReason } from './types';

/** Local tap-to-toggle reactions (counts never leave the device in v1). */
export const MEME_REACTIONS = ['🔥', '💀', '😭', '❤️', '👏'] as const;

/** Analytics event names (emitted via `shared/lib/analytics` `track`). */
export const MEME_EVENTS = {
  FEED_VIEW: 'meme_feed_view',
  REACT: 'meme_react',
  SAVE: 'meme_save',
  SHARE: 'meme_share',
  HIDE: 'meme_hide',
  REPORT: 'meme_report',
  CTA_CLICK: 'meme_cta_click',
  MODE_CHANGE: 'meme_mode_change',
  CATEGORY: 'meme_category',
} as const;

/** An interstitial card every N jokes feeds people back into the funnel. */
export const MEME_CTA_EVERY = 12;

/** localStorage key for local reactions/saves/hides. */
export const MEME_STORE_KEY = 'ww-memes';

/** The server rejects `page` above this (400) — it is the last page of the list. */
export const MEME_LAST_PAGE = 14;

/** Hidden joke ids kept on the device; the oldest fall off past this. */
export const MEME_HIDDEN_CAP = 500;

/** Already-seen ids sent with each page request so the random tail avoids repeats. */
export const MEME_EXCLUDE_CAP = 500;

/** Estimated row height before measurement (card + gap), px. */
export const MEME_ROW_ESTIMATE_PX = 520;

export const MEME_CATEGORY_CHIPS: MemeCategoryChip[] = [
  { id: 'mix', label: 'Mix' },
  { id: 'misc', label: 'Misc' },
  { id: 'programming', label: 'Programming' },
  { id: 'pun', label: 'Puns' },
];

/** Shown only to members with the unfiltered 18+ mode on. */
export const MEME_DARK_CHIP: MemeCategoryChip = { id: 'dark', label: 'Dark' };

export const MEME_REPORT_REASONS: Array<{ id: MemeReportReason; label: string }> = [
  { id: 'offensive', label: 'Offensive' },
  { id: 'sexual', label: 'Sexual content' },
  { id: 'hateful', label: 'Hateful' },
  { id: 'broken', label: 'Broken or unreadable' },
  { id: 'other', label: 'Something else' },
];

/** Slow-rising laughter behind the viewport. */
export const MEME_FLOATERS: MemeFloater[] = [
  { glyph: '😂', left: '6%', size: '2rem', duration: '22s', delay: '0s' },
  { glyph: '🔥', left: '18%', size: '1.4rem', duration: '17s', delay: '-6s' },
  { glyph: '💀', left: '32%', size: '1.7rem', duration: '24s', delay: '-12s' },
  { glyph: '😭', left: '48%', size: '1.3rem', duration: '19s', delay: '-3s' },
  { glyph: '❤️', left: '63%', size: '1.2rem', duration: '21s', delay: '-9s' },
  { glyph: '👏', left: '76%', size: '1.5rem', duration: '18s', delay: '-15s' },
  { glyph: '🤣', left: '88%', size: '2.2rem', duration: '26s', delay: '-7s' },
  { glyph: '✨', left: '42%', size: '1.1rem', duration: '16s', delay: '-11s' },
];
