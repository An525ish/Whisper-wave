/**
 * Socket event names for the `/anon` namespace.
 *
 * MIRROR of `client/src/shared/constants/anonEvents.ts` — keep the two files
 * identical, including the order. This one is the server's copy; the client
 * owns the same strings and neither is generated from the other, so a change
 * here without a change there is a silent runtime break (the client listens to a
 * name the server never emits).
 */

// ── Client → Server (/anon namespace) ──────────────────────────────────────
export const ANON_MESSAGE = 'ANON_MESSAGE';
export const ANON_TYPING_START = 'ANON_TYPING_START';
export const ANON_TYPING_STOP = 'ANON_TYPING_STOP';
export const ANON_LIKE = 'ANON_LIKE';
export const ANON_NEXT = 'ANON_NEXT'; // skip current match
export const ANON_REQUEUE = 'ANON_REQUEUE'; // ask to be matched again
/**
 * Add or remove one curated vibe reaction on a single message.
 *
 * Client → server. The reaction must be in the curated `ANON_REACTIONS` set —
 * this is a whitelist, not an emoji keyboard.
 */
export const ANON_REACT = 'ANON_REACT';

// ── Server → Client (/anon namespace) ──────────────────────────────────────
export const QUEUE_JOINED = 'QUEUE_JOINED';
export const MATCH_FOUND = 'MATCH_FOUND';
export const MATCH_MESSAGE = 'MATCH_MESSAGE';
export const MATCH_TYPING_START = 'MATCH_TYPING_START';
export const MATCH_TYPING_STOP = 'MATCH_TYPING_STOP';
export const SOMEONE_VIBING = 'SOMEONE_VIBING'; // one-sided like signal (vague)
export const MUTUAL_LIKE = 'MUTUAL_LIKE';
export const MATCH_DISCONNECTED = 'MATCH_DISCONNECTED'; // partner left or skipped
export const MATCH_ERROR = 'MATCH_ERROR'; // server-side validation error
export const MATCH_MESSAGE_REJECTED = 'MATCH_MESSAGE_REJECTED'; // moderation / limits
export const MATCH_PARTNER_VIBED = 'MATCH_PARTNER_VIBED'; // replayable like signal
export const SESSION_EXPIRED = 'SESSION_EXPIRED'; // session gone — rejoin the queue
export const CONNECTION_READY = 'CONNECTION_READY'; // both sides completed — real DM created
/**
 * A reaction landed. Emitted to BOTH participants so the sender's optimistic
 * bubble and the partner's bubble settle from the same one path.
 *
 * `action: 'removed'` means the same reaction was sent again — sending a
 * reaction you already gave removes it.
 */
export const MATCH_REACTION = 'MATCH_REACTION'; // curated reaction added/removed on a message

/** Client-supplied idempotency key on ANON_MESSAGE, echoed back in the ack. */
export const ANON_MESSAGE_ID_MAX = 64;

/**
 * Longest accepted `messageId` on ANON_REACT.
 *
 * Kept in step with `ANON_MESSAGE_ID_MAX`: a client may only react to a message
 * it could have sent, and a longer id than the server will ever have minted is
 * a client bug we reject rather than trust.
 */
export const ANON_MESSAGE_ID_MAX_REACT = 64;
