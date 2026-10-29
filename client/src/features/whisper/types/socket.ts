/** `/anon` socket payloads, acks and the live socket ref. Types only. */

import type { Socket } from 'socket.io-client';
import type { AnonReaction } from './core';

type AnonReactionAction = 'added' | 'removed';

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
  image?: { url: string };
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
