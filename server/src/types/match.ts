import type { Types } from 'mongoose';

// ── Vibe ─────────────────────────────────────────────────────────────────────

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

/**
 * Preset vibe tags live in ONE place: `ALL_VIBE_TAGS` in
 * client/src/features/whisper/constants.ts. The server deliberately does NOT
 * keep a second copy — a previous version had both and they drifted
 * ("deep_talks" vs "deep talks"), which meant vibe-overlap scoring could never
 * match. The server accepts any custom tag and canonicalises it; the preset list
 * is a UI suggestion, not a server-side contract.
 */

/** Canonical form of a user-supplied tag — mirrors the client helper exactly. */
export const normalizeVibeTag = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .replace(/[\s._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20);

/**
 * Open string — custom user-typed tags are allowed; the join validator enforces
 * shape/length with a regex and then canonicalises.
 */
export type VibeTag = string;

// ── Redis session state ───────────────────────────────────────────────────────

export type SessionStatus = 'active' | 'ending';

export type AnonSession = {
  sessionId: string;
  anon1: string; // anonId
  anon2: string;
  name1: string;
  name2: string;
  tags1: VibeTag[]; // JSON-serialised in Redis
  tags2: VibeTag[];
  /**
   * Signed-in account behind each side, when the socket could verify one.
   *
   * Always optional: an anonymous session must stay fully anonymous, and every
   * field written before these existed still parses. `name1`/`name2` are the
   * *anon alias* the client picked — never the account name, because the other
   * side of an anonymous chat must not learn it.
   */
  userId1?: string;
  userId2?: string;
  status: SessionStatus;
  createdAt: number; // Unix ms
};

/**
 * A matchable party: the anonId every client already carries, plus the
 * signed-in account when one could be verified.
 *
 * Blocking is checked against BOTH identities, which is the whole reason this
 * type exists — see `services/match/block.ts`.
 */
export type MatchIdentity = { anonId: string; userId?: string };

/** Arguments for `createSession` — a bag, not nine positional parameters. */
export type CreateSessionInput = {
  sessionId: string;
  anon1: string;
  anon2: string;
  name1: string;
  name2: string;
  tags1: VibeTag[];
  tags2: VibeTag[];
  userId1?: string;
  userId2?: string;
};

// ── connectToken payload ──────────────────────────────────────────────────────

export type ConnectTokenPayload = {
  sessionId: string;
  anonId: string; // the holder's own anonId
  partnerAnonId: string;
  displayName: string;
  partnerName: string;
  vibeTags: VibeTag[];
  partnerTags: VibeTag[];
};

// ── Mongo document shapes ─────────────────────────────────────────────────────

export type PendingConnectionSide = {
  anonId: string;
  userId: Types.ObjectId | null;
  displayName: string;
  vibeTags: VibeTag[];
};

export type PendingConnectionStatus = 'pending' | 'processing' | 'completed' | 'expired';

export type IPendingConnectionFields = {
  sessionId: string;
  sides: [PendingConnectionSide, PendingConnectionSide];
  status: PendingConnectionStatus;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type IConnectionFields = {
  users: [Types.ObjectId, Types.ObjectId];
  /** Normalized, order-independent pair key ("<smallerId>_<largerId>") — the real uniqueness guarantee. */
  pairKey: string;
  chat: Types.ObjectId;
  originAnonSession: string;
  originNames: [string, string];
  originVibeTags: [VibeTag[], VibeTag[]];
  connectedAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

export type IReportFields = {
  reporter: Types.ObjectId | null; // null = anonymous reporter
  reporterAnonId: string | null;
  targetType: 'user' | 'anonSession';
  targetUserId: Types.ObjectId | null;
  targetAnonId: string | null;
  sessionId: string | null;
  chatId: Types.ObjectId | null;
  reason: ReportReason;
  details: string | null;
  reviewed: boolean;
  createdAt: Date;
};

export type ReportReason =
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'underage'
  | 'other';

// ── Queue / pairing ─────────────────────────────────────────────────────────

/** An anon user's identity card. Persisted in Redis, not Mongo. */
export type WaitingCard = {
  anonId: string;
  displayName: string;
  vibeTags: VibeTag[];
  gender: Gender;
  /**
   * Signed-in account behind this identity card, when the socket could verify
   * one. Optional by design — a guest has none, and the alias above is chosen
   * by the client regardless of whether the account is signed in.
   */
  userId?: string;
  /** Unix ms — when the user last entered the queue (drives fairness). */
  joinedAt: number;
};

export type MatchCandidate = { anonId: string; score: number; rank: number };

export type PairResult =
  | { paired: false }
  | {
      paired: true;
      sessionId: string;
      /**
       * The session's real start time, Unix ms. Carried out so `MATCH_FOUND` can
       * report it — a client that defaults this to "now" makes a resumed thread
       * look brand new and its expiry countdown wrong.
       */
      createdAt: number;
      partner: WaitingCard;
      self: WaitingCard;
    };

// ── Messaging ───────────────────────────────────────────────────────────────

/**
 * A buffered anon message.
 *
 * `id` is the sender's client-generated idempotency key, carried through so a
 * reconnected client can reconcile its own history with the live thread.
 * Optional because entries written before ids existed still parse.
 */
export type BufferedAnonMessage = {
  id?: string;
  from: string;
  content: string;
  sentAt: number;
};

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
  /** The signed-in account's rolling daily whisper cap is reached. */
  | 'quota_exceeded';

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

/**
 * The curated reaction set, and the only one the server will accept.
 *
 * A fixed list on purpose: accepting arbitrary emoji from the client means any
 * glyph at all can be rendered inside someone else's bubble, which is a
 * moderation surface with no moderation. Keep it small and on-brand — this is a
 * curated Gen Z set, not an emoji keyboard.
 *
 * These are stable wire keys, not glyphs. The client owns the presentation, so a
 * new reaction is a new key here and a new glyph there.
 *
 * Mirrored by the client's `ANON_REACTIONS` in
 * `client/src/shared/constants/anonEvents.ts`; one source, referenced from the
 * other side in a comment.
 */
export const ANON_REACTIONS = ['fire', 'slay', 'dead', 'fr', 'peak', 'lit'] as const;

export type AnonReaction = (typeof ANON_REACTIONS)[number];

/** What one reaction event did, broadcast to both participants. */
export type AnonReactionAction = 'added' | 'removed';

/** Server → client `MATCH_REACTION` payload. */
export type AnonReactionEvent = {
  messageId: string;
  reaction: AnonReaction;
  /** Which side reacted — the client maps this to "me" or "them". */
  anonId: string;
  action: AnonReactionAction;
};

/** One message's reactions, keyed by the anonId that left each one. */
export type AnonMessageReactions = Record<string, AnonReaction[]>;

/**
 * Every buffered message's reactions, keyed by messageId.
 *
 * Sent with `MATCH_FOUND` on resume so a reconnecting client can paint the whole
 * thread from the one payload, with no per-message fetch. Messages with no
 * reactions are omitted rather than sent as an empty object.
 */
export type AnonSessionReactions = Record<string, AnonMessageReactions>;

// ── Likes ───────────────────────────────────────────────────────────────────

export type LikeResult =
  | { type: 'one_sided' } // only one like so far
  | { type: 'mutual'; tokenA: string; tokenB: string }; // tokens for both sides

// ── Vibe eligibility ────────────────────────────────────────────────────────

export type VibeGateInput = {
  /** Session creation time, Unix ms. */
  createdAt: number;
  countA: number;
  countB: number;
  now?: number;
};

// ── Moderation ──────────────────────────────────────────────────────────────

export type ModerationReason = 'sexual' | 'solicitation' | 'violence' | 'blocked_word';

export type MessageVerdict =
  | { allowed: true }
  | { allowed: false; reason: ModerationReason };

// ── Connection origin (the "how we met" story) ──────────────────────────────

export type ConnectionOrigin = {
  connectionId: string;
  chatId: string;
  originNames: [string, string];
  originVibeTags: [VibeTag[], VibeTag[]];
  connectedAt: string | null;
  /** Which of the two origin entries belongs to the requesting user. */
  selfIndex: 0 | 1;
  selfAlias: string;
  partnerAlias: string;
  selfVibes: VibeTag[];
  partnerVibes: VibeTag[];
  partnerName: string;
  partnerUsername?: string;
  partnerAvatar?: string;
};
