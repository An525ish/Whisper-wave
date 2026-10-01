// ── Client → Server (/anon namespace) ──────────────────────────────────────
export const ANON_MESSAGE = 'ANON_MESSAGE';
export const ANON_TYPING_START = 'ANON_TYPING_START';
export const ANON_TYPING_STOP = 'ANON_TYPING_STOP';
export const ANON_LIKE = 'ANON_LIKE';
export const ANON_NEXT = 'ANON_NEXT'; // skip current match
export const ANON_REQUEUE = 'ANON_REQUEUE'; // ask to be matched again

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

export {
  type AnonMessageAck,
  type BufferedAnonMessage,
  type MatchFoundPayload,
  type QueueJoinedPayload,
  type MatchMessagePayload,
} from '../types/socket';
