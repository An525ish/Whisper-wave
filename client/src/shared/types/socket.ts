// NewMessagePayload (chatId + ChatMessage) is a chat-domain type and lives in
// features/chat/types/chat.ts; consumers import it from there directly.

export type NewMessageAlertPayload = {
  chatId: string;
};

export type OnlineUsersPayload = {
  userIds: string[];
};

export type UserPresencePayload = {
  userId: string;
  lastSeen?: string;
};

export type TypingPayload = {
  chatId: string;
};

// ── /anon namespace (anonymous matchmaking) ────────────────────────────────

/**
 * Machine-readable failure class for `MATCH_ERROR` and the failure acks.
 *
 * `reason`/`message` is prose written for people and would drift if the client
 * tried to pattern-match it; this is the part the client branches on. Mirrors
 * `AnonFailureCode` in `server/src/types/match.ts`.
 */
export type AnonFailureCode =
  /** The server no longer considers this a live match. */
  | 'session_ended'
  /** Reaction not in the curated set, or the message id was malformed. */
  | 'invalid_reaction'
  /** Reserved; not emitted yet. */
  | 'unknown_message'
  /** A signed-in account already holds an anon match on another device. */
  | 'already_matched'
  /** Signed-in user has used their rolling daily allowance. */
  | 'quota_exceeded'
  /** The per-socket limiter dropped this event. Mirrors the server union. */
  | 'rate_limited';

/** Client → server ack shape for `ANON_MESSAGE`. */
export type AnonMessageAck = {
  ok: boolean;
  /** Echoes the client-supplied idempotency key so the bubble can be settled. */
  id?: string;
  reason?: string;
  code?: AnonFailureCode;
};

/** Client → server ack shape for `ANON_REACT`. */
export type AnonReactionAck = {
  ok: boolean;
  messageId?: string;
  reason?: string;
  code?: AnonFailureCode;
};

export type BufferedAnonMessage = {
  id?: string;
  from: string;
  content: string;
  sentAt: number;
};

/** Curated reaction keys. Mirrors `ANON_REACTIONS` in `anonEvents.ts`. */
export type AnonReaction = (typeof import('../constants/anonEvents').ANON_REACTIONS)[number];

export type AnonReactionAction = 'added' | 'removed';

/**
 * `MATCH_REACTION` payload — emitted to BOTH participants so the sender's
 * optimistic bubble and the partner's bubble settle from one path. `anonId` is
 * the reactor, mapped to 'me'/'them' the same way `BufferedAnonMessage.from` is.
 */
export type AnonReactionEvent = {
  messageId: string;
  reaction: AnonReaction;
  anonId: string;
  action: AnonReactionAction;
};

/** messageId → anonId → that person's reactions (at most one each). */
export type AnonSessionReactions = Record<string, Record<string, AnonReaction[]>>;

export type MatchFoundPayload = {
  sessionId: string;
  /**
   * The session's real start, Unix ms. Present on a brand-new match *and* on a
   * resume, which is the point: without it a reconnected thread resets its
   * elapsed timer to "just met" and its 24h expiry countdown starts over.
   */
  createdAt: number;
  partner: { displayName: string; vibeTags: string[] };
  bufferedMessages: BufferedAnonMessage[];
  /** Resume only — a brand-new match has no history to carry. */
  reactions?: AnonSessionReactions;
};

export type QueueJoinedPayload = {
  position?: string;
  /** How many people are waiting — powers honest empty-queue copy. */
  queueSize?: number;
};

export type MatchMessagePayload = BufferedAnonMessage;
