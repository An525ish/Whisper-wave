/**
 * Whisper data-model types. Constants live in `constants.ts`, pure transforms in
 * `utils/`. This file is types only.
 */

import type { Socket } from 'socket.io-client';
import type { ANON_REACTIONS, REPORT_REASONS } from './constants';

export type VibeTag = string;

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type AnonMatchStatus =
  | 'idle'
  /** The identity card is being saved. The socket must NOT connect yet. */
  | 'joining'
  | 'waiting'
  /** Refresh-restore: socket connects with `auth.resume`, never queues. */
  | 'resuming'
  | 'matched'
  /** Partner left. The thread stays readable, the composer is replaced, and the
   *  socket stays warm so re-matching is immediate. Not the same as `idle`. */
  | 'partner_left'
  | 'connected';

/**
 * Delivery state for an outgoing bubble.
 *
 * The server acks ANON_MESSAGE, so "I pressed send" is no longer the same as
 * "the partner got it". Without this, a message rejected by moderation or by
 * the rate limiter used to sit in the sender's thread forever looking sent.
 */
type DeliveryState = 'sending' | 'sent' | 'failed';

export type AnonReaction = (typeof ANON_REACTIONS)[number];

type AnonReactionAction = 'added' | 'removed';

export type AnonMessage = {
  /** Client-generated idempotency key; matches the server ack. */
  id: string;
  from: 'me' | 'them';
  content: string;
  sentAt: number;
  /** Only meaningful for `from: 'me'`. */
  delivery?: DeliveryState;
  /** Populated when `delivery === 'failed'` so the UI can explain itself. */
  failureReason?: string;
  /**
   * Curated reactions on this bubble. The server already speaks in 'me'/'them'
   * (relative to this client), so the store never holds an anonId.
   * At most one per side — sending a second replaces the first.
   */
  reactions?: {
    me?: AnonReaction;
    them?: AnonReaction;
  };
};

// ── /anon socket payloads ──────────────────────────────────────────────────

/**
 * Machine-readable failure class for `MATCH_ERROR` and the failure acks.
 *
 * `reason`/`message` is prose written for people; this is the part the client
 * branches on. Mirrors `AnonFailureCode` in `server/src/types/match.ts`. The
 * server may add codes before the client learns them — every consumer must treat
 * an unrecognised code like "no code" rather than throw.
 */
type AnonFailureCode =
  | 'session_ended'
  | 'invalid_reaction'
  | 'unknown_message'
  | 'already_matched'
  | 'duplicate_id'
  | 'quota_exceeded'
  | 'rate_limited';

/** Ack shape for `ANON_MESSAGE`. */
export type AnonMessageAck = {
  ok: boolean;
  /** Echoes the client-supplied idempotency key so the bubble can be settled. */
  id?: string;
  reason?: string;
  code?: AnonFailureCode;
};

/** Ack shape for `ANON_LIKE`. */
export type AnonLikeAck =
  | { ok: true; mutual: boolean }
  | { ok: false; code: string; reason?: string };

/** Ack shape for `ANON_REACT` — only a rejection needs handling. */
export type AnonReactionAck = {
  ok: boolean;
  messageId?: string;
  reason?: string;
  code?: AnonFailureCode;
};

/** A message on the wire; `from` is relative to the receiving client. */
export type BufferedAnonMessage = {
  id?: string;
  from: 'me' | 'them';
  content: string;
  sentAt: number;
};

/** `MATCH_REACTION` payload — sent to BOTH participants; `by` is relative to the recipient. */
export type AnonReactionEvent = {
  messageId: string;
  reaction: AnonReaction;
  by: 'me' | 'them';
  action: AnonReactionAction;
};

/** messageId → that message's reactions per side (at most one each). */
export type AnonSessionReactions = Record<
  string,
  { me?: AnonReaction[]; them?: AnonReaction[] }
>;

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

export type MatchErrorPayload = {
  message: string;
  code?: AnonFailureCode;
};

/** The live `/anon` socket, shared between the lifecycle and the send actions. */
export type AnonSocketRef = { current: Socket | null };

// ── HTTP ───────────────────────────────────────────────────────────────────

export type JoinQueuePayload = {
  displayName: string;
  vibeTags: VibeTag[];
  gender: Gender;
  /** 18+ attestation. Required — anonymous chat is not for minors. */
  ageConfirmed: boolean;
};

/** `POST /match/join` only saves the identity card; the socket does the queueing. */
export type JoinQueueResponse = {
  success: boolean;
  data: {
    status: 'waiting';
  };
};

export type ReportReason = (typeof REPORT_REASONS)[number]['value'];

export type SubmitReportPayload = {
  sessionId: string;
  reason: ReportReason;
  details?: string;
};

export type CompleteConnectionResponse = {
  success: boolean;
  data:
    | {
        status: 'connected';
        chatId: string;
        connectionId: string;
        originNames: [string, string];
        originVibeTags: [VibeTag[], VibeTag[]];
      }
    | {
        status: 'waiting_for_partner';
        chatId: '';
        connectionId: '';
        originNames: [string, string];
        originVibeTags: [VibeTag[], VibeTag[]];
      };
};

/** One row of `GET /api/connection/pending`. Copy stays neutral server-side. */
export type PendingConnectionItem = {
  /** `claim:<sessionId>` (redeemable by me) or `pending:<sessionId>` (waiting for them). */
  id: string;
  sessionId: string;
  origin: { partnerAlias: string; tags: VibeTag[] };
  /** ISO timestamp when this item expires. */
  expiresAt: string;
  state: 'action_needed' | 'waiting_for_partner';
};

export type PendingListResponse = {
  success: boolean;
  data: { items: PendingConnectionItem[] };
};

/** `GET /api/match/quota` — members only; guests are never capped. */
export type WhisperQuotaResponse = {
  success: boolean;
  data: { limit: number; remaining: number };
};

/** The "how we met" story for a DM that began as an anonymous match. */
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

// ── Derived / local models ─────────────────────────────────────────────────

/** A returning guest's saved identity card (localStorage). */
export type StoredIdentity = {
  displayName: string;
  vibeTags: VibeTag[];
  gender: Gender;
};

/** The two aliases decoded from a connectToken, for auth-screen copy. */
export type TokenAliases = { self?: string; partner?: string };

/** What the panel shows about the thread you're currently in (or just left). */
export type ThreadStats = {
  /** Whole minutes in the thread, floored. */
  minutes: number;
  totalMessages: number;
  myMessages: number;
  theirMessages: number;
  /** Tags both sides picked — the thing that made the match plausible. */
  sharedTags: VibeTag[];
};

/** Your vibe tags against theirs, split for the overlap view. */
export type VibeOverlap = {
  /** In both, in your casing. */
  shared: VibeTag[];
  onlyMine: VibeTag[];
  onlyTheirs: VibeTag[];
};

/** A suggested opener the user can drop into the composer. */
export type Spark = {
  key: string;
  emoji: string;
  text: string;
};

/** A link that appeared in the thread, newest first in lists. */
export type ThreadLink = {
  url: string;
  /** Hostname without a leading `www.` — what the row shows. */
  host: string;
  from: 'me' | 'them';
  sentAt: number;
};

/** How often each side has used one curated reaction in this thread. */
export type ReactionTally = {
  reaction: AnonReaction;
  me: number;
  them: number;
};

/** Which half of the profile rail is showing. */
export type ProfileTab = 'them' | 'you';

/** Everything the end-of-thread card needs, derived in one pure pass. */
export type ThreadSummary = {
  /** Clamped at 0. Never negative, never NaN. */
  durationMs: number;
  /** `"0m"`, `"4m"`, `"1h 12m"`. */
  durationLabel: string;
  totalMessages: number;
  myMessages: number;
  theirMessages: number;
  /** Tags both sides had, matched case-insensitively, in the caller's casing. */
  sharedTags: VibeTag[];
  /** One warm line. Never implies the other person did something wrong. */
  verdict: string;
};

/** Which control asked to skip the current match — analytics label only. */
export type NextSource = 'chat' | 'partner_left' | 'report';

/** Why a Back press / chevron tap is waiting on the user's answer. */
export type LeaveConfirmKind = 'leave' | 'skip';

/** Where a DM open came from — analytics label only. */
export type DmOpenSource = 'whisper' | 'resume_after_auth' | 'connection_ready' | 'pending';

/** One row of the virtualized thread. */
export type ThreadRow =
  | { kind: 'lead' }
  | { kind: 'empty' }
  | { kind: 'typing' }
  | { kind: 'message'; index: number };

/** What `WhisperSessionProvider` shares: the owned socket plus typing state. */
export type WhisperSession = {
  /** The `/anon` connection. Owned by the provider; screens only send through it. */
  socketRef: AnonSocketRef;
  partnerTyping: boolean;
  setPartnerTyping: (v: boolean) => void;
};
