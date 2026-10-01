/**
 * Centralised Redis key builders — one place to change TTLs and naming.
 * All TTLs are in seconds (ioredis EX param).
 */

export const REDIS_KEYS = {
  queue: 'match:queue:global',
  waiting: (anonId: string) => `match:waiting:${anonId}`,
  session: (sessionId: string) => `match:session:${sessionId}`,
  likes: (sessionId: string) => `match:likes:${sessionId}`,
  messages: (sessionId: string) => `match:messages:${sessionId}`,
  blocked: (anonId: string) => `match:blocked:${anonId}`,
  /** anonId → active sessionId (socket reconnect / late MATCH_FOUND). */
  activeSession: (anonId: string) => `match:active:${anonId}`,
  /**
   * anonId → sessionId, set the moment a socket drops while matched.
   * The session is only torn down after this key expires, which gives a
   * reconnecting client (refresh, flaky mobile network, backgrounded tab) a
   * grace window to resume instead of destroying the match for both people.
   */
  presence: (anonId: string) => `match:presence:${anonId}`,
  /** Throttle key for the "partner left for real" broadcast. */
  presenceNotified: (sessionId: string) => `match:presence-notified:${sessionId}`,
} as const;

export const TTL = {
  /**
   * Lifetime of an anon user's identity card (display name + vibes + gender).
   *
   * This used to double as "is this user still queueing?", which meant a card
   * silently expiring under a connected client stranded them in a spinner. The
   * card is now pure identity — queue membership lives in the `match:queue`
   * list — so it is refreshed on every interaction and can safely outlive the
   * queue. Disconnect (not TTL) is what removes someone from the queue.
   */
  waiting: 24 * 60 * 60, // 24 h — matches the anonId cookie
  /** How long an active session lasts from last activity. */
  session: 24 * 60 * 60, // 24 h
  /** Block list per anonId — soft block for the day. */
  blocked: 30 * 24 * 60 * 60, // 30 days
  /** How many messages we buffer per session in Redis. */
  maxMessages: 50,
  /**
   * Grace window after a socket drop before a match is really ended.
   * Long enough for a page refresh or a tunnel/LTE hiccup, short enough that
   * a user who closes the tab isn't left in limbo.
   */
  presence: 45, // 45 s
} as const;
