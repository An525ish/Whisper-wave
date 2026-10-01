export const BASE_URL: string = import.meta.env.VITE_BASE_URL;

export const MAX_FILES = 5 as const;

/** One source for the product tagline — previously duplicated in three files. */
export const PRODUCT_VOICE = 'Anonymous when you want. Connected when it clicks.' as const;

export const MAX_TEXTAREA_HEIGHT = 128 as const;

/**
 * Composer geometry, shared so the logged-in chat and the anonymous chat are
 * literally the same control. These are Tailwind class strings rather than px
 * because the floor is enforced by the element's own `min-height` — a JS-side
 * pixel clamp would be a second source for the same number.
 *
 * `_COMPACT` variants are the logged-in composer's reduced-density mode; the
 * anonymous composer has no compact variant.
 */
export const COMPOSER_ROW_MIN_CLASS = 'min-h-11' as const;
export const COMPOSER_ROW_MIN_CLASS_COMPACT = 'min-h-9' as const;
/** The input pill's 1px border adds 2px to the outer height. */
export const COMPOSER_SEND_SIZE_CLASS = 'size-[calc(2.75rem+2px)]' as const;
export const COMPOSER_SEND_SIZE_CLASS_COMPACT = 'size-[calc(2.25rem+2px)]' as const;
/**
 * Default composer shell. The logged-in chat adds `md:bg-transparent` because it
 * sits inside a conversation panel; the anonymous composer is a full-screen
 * immersive room and must keep its surface at every width.
 */
export const COMPOSER_SHELL_CLASS =
  'flex h-full w-full min-w-0 flex-col overflow-hidden rounded-3xl border border-border bg-primary/40 transition focus-within:border-green/45 focus-within:shadow-[0_0_0_3px_rgba(1,195,109,0.08)]' as const;

export const SEARCH_DEBOUNCE_MS = 450 as const;
export const MIN_GROUP_MEMBERS = 2 as const;
export const MAX_GROUP_NAME_LENGTH = 60 as const;
export const TYPING_DEBOUNCE_MS = 1200 as const;

export const TYPING_STALE_MS = 3500 as const;
export const VIEWPORT_PADDING = 8 as const;
export const RELOAD_KEY = 'ww:chunk-reload-at' as const;
export const RELOAD_COOLDOWN_MS = 15_000 as const;

/** Exit-animation duration for right-side detail slide-over panels. */
export const DETAIL_PANEL_TRANSITION_MS = 320 as const;

/** Empty-state illustration shown when a member/user/group list is empty. */
export const NO_MEMBERS_IMAGE = '/images/no-member.svg' as const;

/** Shared fallback when a user/group avatar is missing or fails to load. */
export const AVATAR_FALLBACK = '/icons/no-dp.svg' as const;

/** Shown while an avatar URL is loading. */
export const AVATAR_LOADING = '/icons/avatar-loading.svg' as const;

/** Parent must be square; centers dot on the circular edge (~45° bottom-right). */
export const AVATAR_ONLINE_DOT_POSITION_CLASS =
  'left-[calc(50%+25%*sqrt(2))] top-[calc(50%+25%*sqrt(2))] -translate-x-1/2 -translate-y-1/2' as const;
