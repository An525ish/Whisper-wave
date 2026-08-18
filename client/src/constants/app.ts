export const BASE_URL: string = import.meta.env.VITE_BASE_URL;

export const MAX_FILES = 5 as const;

export const MAX_TEXTAREA_HEIGHT = 128 as const;
export const SEARCH_DEBOUNCE_MS = 450 as const;
export const MIN_GROUP_MEMBERS = 2 as const;
export const MAX_GROUP_NAME_LENGTH = 60 as const;
export const TYPING_DEBOUNCE_MS = 1200 as const;

export const TYPING_STALE_MS = 3500 as const;
export const VIEWPORT_PADDING = 8 as const;
export const RELOAD_KEY = 'ww:chunk-reload-at' as const;
export const RELOAD_COOLDOWN_MS = 15_000 as const;

/** Shared fallback when a user/group avatar is missing or fails to load. */
export const AVATAR_FALLBACK = '/icons/no-dp.svg' as const;

/** Shown while an avatar URL is loading. */
export const AVATAR_LOADING = '/icons/avatar-loading.svg' as const;
