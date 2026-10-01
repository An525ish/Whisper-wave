/**
 * Whisper data-model types. Constants live in `constants.ts`, pure transforms in
 * `utils/`. This file is types only.
 */

export type VibeTag = string;

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type AnonMatchStatus =
  | 'idle'
  | 'joining'
  | 'waiting'
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
export type DeliveryState = 'sending' | 'sent' | 'failed';

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
};

export type JoinQueuePayload = {
  displayName: string;
  vibeTags: VibeTag[];
  gender: Gender;
  /** 18+ attestation. Required — anonymous chat is not for minors. */
  ageConfirmed: boolean;
};

export type JoinQueueResponse = {
  success: boolean;
  data: {
    status: 'waiting';
    anonId: string;
    isNewIdentity: boolean;
  };
};

export type ReportReason =
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'underage'
  | 'other';

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
