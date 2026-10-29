/**
 * Every in-app URL, in one place.
 *
 * Link and navigate to these instead of typing a path, so a section can move
 * without a hunt through the codebase. Builders take the dynamic segment.
 * Admin paths live with the admin feature and are not listed here.
 *
 * A persona page (`/me`) is intentionally absent: the persona editor has no
 * route yet. `/games` lists free games on other sites (links out, no embeds).
 */
export const ROUTES = {
  landing: '/',
  home: '/home',
  whisper: '/whisper',
  rooms: '/rooms',
  newRoom: '/rooms/new',
  room: (slug: string) => `/rooms/${slug}`,
  memes: '/memes',
  games: '/games',
  chats: '/chats',
  chat: (chatId: string) => `/chats/${chatId}`,
  auth: '/auth',
  /** Login entry with the mode preselected — the only sanctioned query-variant. */
  authLogin: '/auth', // default face; only register needs a param
  authRegister: '/auth?mode=register',
  sparkPass: '/spark-pass',
  apps: '/apps',
  feedback: '/feedback',
} as const;

/** Route patterns for `useMatch` and router definitions that need the param. */
export const ROUTE_PATTERNS = {
  chat: '/chats/:chatId',
  /** The pre-hub URL, kept alive as a redirect so bookmarks and old links work. */
  legacyChat: '/chat/:chatId',
  room: '/rooms/:slug',
} as const;
