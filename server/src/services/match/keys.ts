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
  /**
   * userId → SET of the anon sessionIds that account currently holds.
   *
   * A signed-in user on a phone and a laptop is two anon identities, and
   * `match:active:{anonId}` can only ever see one of them — so "is this account
   * already in a whisper?" is unanswerable from the anonId side alone. This
   * index is the cluster-shared answer, and it is what stops an account matching
   * its own other device.
   *
   * Maintained in `createSession` / `endSession` / `deleteSession` and left to
   * expire on its own if the process dies mid-session, so a stale entry can
   * never outlive the session it points at by more than `TTL.session`.
   */
  userSessions: (userId: string) => `match:user:${userId}`,
  /**
   * userId → whisper attempts inside the current rolling window.
   *
   * Signed-in users only. Guests are never capped: they are the top of the
   * funnel and a wall in front of them buys nothing.
   */
  userWhispers: (userId: string) => `match:whispers:${userId}`,
  /**
   * anonId → userId, written whenever both are known (queue join, match create).
   *
   * This is the link that lets a *block* written by an old caller that only
   * knows anonIds still be mirrored onto the account's key. Without it, a block
   * raised while someone was anonymous could not be re-applied to their account,
   * and signing in would be a way to shed it. See `block.ts`.
   *
   * Never deleted: a stale link can only cause an *extra* block to be recorded,
   * and losing one is the failure mode that matters. It expires with the anon
   * cookie.
   */
  identityAlias: (anonId: string) => `match:alias:${anonId}`,
  /**
   * One SET per message: members are `anonId:reaction`.
   *
   * Redis, never Mongo — anon messages are deliberately not persisted, and
   * reactions are part of the same private thread, so they must not outlive it.
   * `messageId` is validated against `[A-Za-z0-9_-]` before it reaches a key.
   */
  reactions: (sessionId: string, messageId: string) =>
    `match:reactions:${sessionId}:${messageId}`,
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
  /**
   * Sorted set of anonIds whose disconnect grace period has not lapsed yet,
   * scored by deadline (epoch ms). `ZRANGEBYSCORE` finds what is due and `ZREM`
   * atomically claims it, so any process can sweep and no two ever do.
   *
   * Replaces the per-process `Map<anonId, Timeout>` of pending sweeps: a
   * `setTimeout` only lives in the process that created it, so a drop on one
   * instance was never swept by any other — see A4 in docs/Todo.md.
   */
  presenceSweeps: 'match:presence-sweeps',
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
  /**
   * anonId → userId link. Outlives the queue entry but not the anon cookie, so
   * a block raised in one match can still be mirrored onto the account in the
   * next one.
   */
  identityAlias: 24 * 60 * 60, // 24 h — matches TTL.session and the anon cookie
  /**
   * Reactions on a single message. Same lifetime as the thread that holds them:
   * when the thread can no longer be replayed, neither can its reactions.
   */
  reactions: 24 * 60 * 60, // 24 h
  /**
   * Signed-in users' rolling whisper window — one counter per account.
   *
   * The window opens on the account's *first* attempt and slides from there,
   * rather than resetting at midnight. A synchronised reset dumps every user
   * into the same instant, and that instant is the join-scan cost — the single
   * most expensive moment in the system. Per-user windows are staggered by
   * construction and cost one `INCR` (plus one `EXPIRE` on the opening attempt)
   * instead of a read-modify-write.
   */
  whisperWindow: 24 * 60 * 60, // 24 h
  /** How many messages we buffer per session in Redis. */
  maxMessages: 50,
  /**
   * Grace window after a socket drop before a match is really ended.
   * Long enough for a page refresh or a tunnel/LTE hiccup, short enough that
   * a user who closes the tab isn't left in limbo.
   */
  presence: 45, // 45 s
} as const;

/**
 * Presence keys for the *signed-in* app.
 *
 * Kept beside `REDIS_KEYS` so key naming still has a single home, but as their
 * own map because they are not anonymous-match keys: `REDIS_KEYS` is uniformly
 * `match:`-namespaced and that invariant is worth keeping.
 */
export const PRESENCE_KEYS = {
  /**
   * userId → SET of socketIds. A signed-in user can hold several at once
   * (tabs, phone + laptop), and this is the cluster-shared record of them.
   */
  userSockets: (userId: string) => `presence:sockets:${userId}`,
} as const;

export const PRESENCE_TTL = {
  /**
   * Upper bound on how long a user's socket set survives without a write.
   *
   * Refreshed on every add/remove, so a user who connects once and stays
   * connected for hours is never dropped from presence. It exists only to stop
   * a hard process crash from leaving that user "online" in Redis forever.
   */
  userSockets: 24 * 60 * 60, // 24 h — matches TTL.session and the anon cookie
} as const;

/**
 * Grace-period sweeper tuning. Not TTLs, so it does not live in `TTL` — that map
 * is in seconds because it feeds ioredis' `EX` parameter, and these do not.
 */
export const PRESENCE_SWEEP = {
  /** How often a process looks for grace periods that have lapsed. */
  intervalMs: 5_000,
  /** Due entries claimed per tick, so one busy tick cannot stall the loop. */
  batchSize: 50,
  /**
   * Seconds past `TTL.presence` before the sweep fires. The presence key has to
   * have actually expired before we conclude the user really left.
   */
  graceOverheadSeconds: 2,
} as const;
