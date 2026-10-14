import type { ANON_REACTIONS } from '../constants/anon-reactions.js';

// ── Messaging ───────────────────────────────────────────────────────────────

/**
 * A message as stored in the Redis buffer. `from` is the sender's anonId, which
 * is server-internal: it is never sent to a client (see `BufferedAnonMessage`).
 *
 * `id` is the sender's client-generated idempotency key, carried through so a
 * reconnected client can reconcile its own history with the live thread.
 * Optional because entries written before ids existed still parse.
 */
export type StoredAnonMessage = {
  id?: string;
  from: string;
  content: string;
  sentAt: number;
};

/** Which side of the conversation, relative to the RECIPIENT of the payload. */
export type AnonMessageSide = 'me' | 'them';

/**
 * A message on the wire (`MATCH_MESSAGE`, `bufferedMessages` in `MATCH_FOUND`).
 * `from` is computed per recipient — the server never sends an anonId.
 */
export type BufferedAnonMessage = {
  id?: string;
  from: AnonMessageSide;
  content: string;
  sentAt: number;
};

/** Result of `acceptAnonMessage`. */
export type AcceptMessageResult =
  | { accepted: true; message: StoredAnonMessage; partnerAnonId: string }
  | { accepted: false; id?: string; reason: string; code?: AnonFailureCode };

/**
 * Machine-readable failure class for the `/anon` namespace.
 *
 * The client branches on this and NEVER on the accompanying prose: a `reason`
 * string is written for humans and gets reworded freely, and pattern-matching it
 * is how the two sides drift apart (the `session_ended` lesson).
 */
export type AnonFailureCode =
  /** The server no longer considers this a live match. */
  | 'session_ended'
  /** The reaction was not in the curated set (or the message id was malformed). */
  | 'invalid_reaction'
  /** No such message in this session's buffer. */
  | 'unknown_message'
  /** The account is already in another anonymous match (another device/tab). */
  | 'already_matched'
  /** This message id was already used in this session (client retry or reuse). */
  | 'duplicate_id'
  /** The signed-in account's rolling daily whisper cap is reached. */
  | 'quota_exceeded'
  /** The per-socket limiter dropped this event. Distinct from every other failure. */
  | 'rate_limited';

/**
 * Ack for `ANON_MESSAGE`.
 *
 * `reason` is prose for humans and may be reworded freely. `code` is the part the
 * client branches on — matching the prose would couple the two sides to wording.
 * `session_ended` means the server no longer considers this a live match, which
 * the client uses to stop presenting a dead thread as a working chat.
 *
 * Mirrors `AnonMessageAck` in `client/src/shared/types/socket.ts`.
 */
export type AnonMessageAck = {
  ok: boolean;
  id?: string;
  reason?: string;
  code?: AnonFailureCode;
};

export type SocketAck = (res: AnonMessageAck) => void;

/** Why an `ANON_LIKE` did not land. The client branches on this, never on `reason`. */
export type AnonLikeFailureCode =
  /** The vibe gate is still closed — chat a little longer. */
  | 'locked'
  /** No live match for this socket (ended, expired, or not a participant). */
  | 'no_session'
  /** The per-anonId like limiter dropped the event. */
  | 'rate_limited'
  /** Anything else (invalid payload, unexpected failure). */
  | 'error';

/**
 * Optional ack for `ANON_LIKE`. `mutual: true` means this like completed a mutual
 * vibe (the `MUTUAL_LIKE` event with the connect token is still emitted as before).
 */
export type AnonLikeAck =
  | { ok: true; mutual: boolean }
  | { ok: false; code: AnonLikeFailureCode; reason?: string };

export type LikeSocketAck = (res: AnonLikeAck) => void;

/**
 * Server → client ack for `ANON_REACT`.
 *
 * Success is NOT delivered here: the applied reaction arrives as `MATCH_REACTION`
 * to both sides so one path settles both bubbles. This ack exists so a rejected
 * attempt (rate limited, dead session, message not in the buffer) can settle the
 * sender's optimistic bubble instead of leaving it spinning forever.
 */
export type AnonReactionAck = {
  ok: boolean;
  messageId?: string;
  reason?: string;
  code?: AnonFailureCode;
};

export type ReactionSocketAck = (res: AnonReactionAck) => void;

// ── Vibe reactions (E1) ─────────────────────────────────────────────────────

export type AnonReaction = (typeof ANON_REACTIONS)[number];

/** What one reaction event did, broadcast to both participants. */
export type AnonReactionAction = 'added' | 'removed';

/** Server → client `MATCH_REACTION` payload. */
export type AnonReactionEvent = {
  messageId: string;
  reaction: AnonReaction;
  /** Who reacted, relative to the recipient. Never an anonId. */
  by: AnonMessageSide;
  action: AnonReactionAction;
};

/** One message's reactions, keyed by the anonId that left each one. SERVER-INTERNAL. */
export type AnonMessageReactions = Record<string, AnonReaction[]>;

/** One message's reactions on the wire, keyed relative to the recipient. */
export type AnonMessageReactionsBySide = Partial<Record<AnonMessageSide, AnonReaction[]>>;

/**
 * Every buffered message's reactions, keyed by messageId.
 *
 * Sent with `MATCH_FOUND` on resume so a reconnecting client can paint the whole
 * thread from the one payload, with no per-message fetch. Messages with no
 * reactions are omitted rather than sent as an empty object.
 */
export type AnonSessionReactions = Record<string, AnonMessageReactionsBySide>;
