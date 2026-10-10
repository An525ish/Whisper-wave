/** Local tap-to-toggle reactions (counts never leave the device in v1). */
export const MEME_REACTIONS = ['🔥', '💀', '😭', '❤️', '👏'] as const;

/** Analytics event names (emitted via `shared/lib/analytics` `track`). */
export const MEME_EVENTS = {
  FEED_VIEW: 'meme_feed_view',
  REACT: 'meme_react',
  SAVE: 'meme_save',
  SHARE: 'meme_share',
  HIDE: 'meme_hide',
  CTA_CLICK: 'meme_cta_click',
  MODE_CHANGE: 'meme_mode_change',
} as const;

/** An interstitial card every N jokes feeds people back into the funnel. */
export const MEME_CTA_EVERY = 12;

/** localStorage key for local reactions/saves/hides. */
export const MEME_STORE_KEY = 'ww-memes';
