/** Core whisper models: vibe tags, gender, match status, thread messages. Types only. */

import type { ANON_REACTIONS } from '../constants';

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
