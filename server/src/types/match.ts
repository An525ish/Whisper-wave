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
  status: SessionStatus;
  createdAt: number; // Unix ms
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
  /** Unix ms — when the user last entered the queue (drives fairness). */
  joinedAt: number;
};

export type MatchCandidate = { anonId: string; score: number; rank: number };

export type PairResult =
  | { paired: false }
  | {
      paired: true;
      sessionId: string;
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

/** Server → client ack for `ANON_MESSAGE`. */
export type AnonMessageAck = { ok: boolean; id?: string; reason?: string };

export type SocketAck = (res: AnonMessageAck) => void;

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
