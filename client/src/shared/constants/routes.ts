/**
 * Every in-app URL, in one place.
 *
 * Link and navigate to these instead of typing a path, so a section can move
 * without a hunt through the codebase. Builders take the dynamic segment.
 * Admin paths live with the admin feature and are not listed here.
 *
 * Rooms / Play / Memes / Me have constants but no routes yet — their surfaces
 * land in later hub phases and ship dark behind server flags (see
 * docs/HUB_PLAN.md §5). The constants exist so code written now already points
 * at the final URLs.
 */
export const ROUTES = {
  landing: '/',
  home: '/home',
  whisper: '/whisper',
  rooms: '/rooms',
  newRoom: '/rooms/new',
  room: (slug: string) => `/rooms/${slug}`,
  play: '/play',
  game: (id: string) => `/play/${id}`,
  memes: '/memes',
  chats: '/chats',
  chat: (chatId: string) => `/chats/${chatId}`,
  me: '/me',
  auth: '/auth',
  /** Login entry with the mode preselected — the only sanctioned query-variant. */
  authLogin: '/auth?mode=login',
  sparkPass: '/spark-pass',
} as const;

/** Route patterns for `useMatch` and router definitions that need the param. */
export const ROUTE_PATTERNS = {
  chat: '/chats/:chatId',
  /** The pre-hub URL, kept alive as a redirect so bookmarks and old links work. */
  legacyChat: '/chat/:chatId',
  room: '/rooms/:slug',
  game: '/play/:gameId',
} as const;
