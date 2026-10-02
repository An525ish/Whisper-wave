/**
 * Whisper domain constants.
 *
 * Preset vibe tags live HERE and only here. A previous version duplicated this
 * list on the server (`VIBE_TAGS`), and the two drifted apart — "deep_talks" vs
 * "deep talks" — which silently broke vibe-overlap scoring. The server accepts
 * any tag and canonicalises it; this list is a UI suggestion, not a contract.
 */

/** Preset suggestions shown in the picker (canonical underscore form). */
export const ALL_VIBE_TAGS: readonly string[] = [
  'cozy', 'deep_talks', 'gaming', 'chaotic', 'music',
  'overthinker', 'night_owl', 'creative', 'bookworm', 'foodie',
  'fitness', 'travel', 'anime', 'movies', 'philosophy',
  'memes', 'coding', 'art', 'sports', 'random',
];

/** Rows of presets visible before the "+N more" toggle. */
export const VISIBLE_PRESETS = 12;

export const MAX_TAGS = 3;
export const MAX_TAG_LENGTH = 20;
export const MAX_DISPLAY_NAME_LENGTH = 24;

/** Mirrors the server cap in `server/src/socket/anon/handlers.ts`. */
export const MAX_MESSAGE_LENGTH = 2000;

/** Debounce before we tell the partner we stopped typing. */
export const TYPING_IDLE_MS = 1500;

/** How long we wait for the server to ack a message before marking it failed. */
export const ACK_TIMEOUT_MS = 8000;

/** sessionStorage key holding a pending connectToken across the auth redirect. */
export const WHISPER_CONNECT_TOKEN_KEY = 'whisper:connectToken';

/**
 * Rolling daily whisper allowance for a signed-in account.
 *
 * Keep in sync with `DAILY_WHISPER_LIMIT` in `server/src/services/match/quota.ts`.
 *
 * The server is the only thing that enforces this — the client copy exists so the
 * picker can set an honest expectation rather than let someone discover the limit
 * by being refused. It is deliberately generous (the server test asserts
 * `>= 20`, calling anything tighter "too tight to be invisible to a real user"),
 * because guests are never capped and capping the top of the funnel would be the
 * wrong lever.
 */
export const DAILY_WHISPER_LIMIT = 30;
