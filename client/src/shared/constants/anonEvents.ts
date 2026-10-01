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

/**
 * MIRRORED FROM `server/src/constants/anon-events.ts` — the two files must stay
 * identical, including order. Neither is generated from the other, so a change on
 * one side without the other is a silent runtime break.
 */

/**
 * Client-supplied idempotency key on ANON_MESSAGE, echoed back in the ack.
 * Mirrors `ANON_MESSAGE_ID_MAX` on the server.
 */
export const ANON_MESSAGE_ID_MAX = 64;

/**
 * The curated reaction set — a whitelist, not an emoji keyboard.
 *
 * Mirrored from `ANON_REACTIONS` in `server/src/types/match.ts`, which the server
 * exports through its types barrel. The server validates against its own copy and
 * rejects anything not in it, so this list is presentation, not policy: the glyph
 * and wording are ours, the permission is theirs.
 */
export const ANON_REACTIONS = ['fire', 'slay', 'dead', 'fr', 'peak', 'lit'] as const;

/** Display metadata for the curated set. The key is what goes on the wire. */
export const ANON_REACTION_LABELS: Record<
  (typeof ANON_REACTIONS)[number],
  { glyph: string; label: string }
> = {
  fire: { glyph: '🔥', label: 'fire' },
  slay: { glyph: '💅', label: 'slay' },
  dead: { glyph: '💀', label: 'dead' },
  fr: { glyph: '🫶', label: 'fr' },
  peak: { glyph: '🏔️', label: 'peak' },
  lit: { glyph: '💡', label: 'lit' },
};

export {
  type AnonFailureCode,
  type AnonMessageAck,
  type AnonReaction,
  type AnonReactionAck,
  type AnonReactionAction,
  type AnonReactionEvent,
  type AnonSessionReactions,
  type BufferedAnonMessage,
  type MatchFoundPayload,
  type QueueJoinedPayload,
  type MatchMessagePayload,
} from '../types/socket';