/**
 * Rooms domain constants.
 *
 * Socket names mirror `server/src/constants/room-events.ts` exactly (existing
 * convention — the server file is the source of truth for the wire contract).
 */

/** Client → server. */
export const ROOM_OUT = {
  JOIN: 'ROOM_JOIN',
  LEAVE: 'ROOM_LEAVE',
  MESSAGE: 'ROOM_MESSAGE',
  REACT: 'ROOM_REACT',
  MOD: 'ROOM_MOD',
} as const;

/** Server → client. */
export const ROOM_IN = {
  STATE: 'ROOM_STATE',
  MESSAGE: 'ROOM_MESSAGE',
  PRESENCE: 'ROOM_PRESENCE',
  REACTION: 'ROOM_REACTION',
  MOD_ACTION: 'ROOM_MOD_ACTION',
  CLOSED: 'ROOM_CLOSED',
  ERROR: 'ROOM_ERROR',
} as const;

/** Analytics event names (emitted via `shared/lib/analytics` `track`). */
export const ROOM_EVENTS = {
  LOBBY_VIEW: 'room_lobby_view',
  JOIN: 'room_join',
  MESSAGE_SENT: 'room_message_sent',
  LEAVE: 'room_leave',
  REPORT: 'room_report',
  CREATED: 'room_created',
  MOD_ACTION: 'room_mod_action',
} as const;

/** Curated reactions — mirrors `server/src/constants/room-reactions.ts`. */
export const ROOM_REACTION_GLYPHS = {
  heart: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  fire: '🔥',
  clap: '👏',
} as const;

export type RoomReactionGlyph = keyof typeof ROOM_REACTION_GLYPHS;

/** Persona color choices for the pre-join sheet (server accepts any hex). */
export const ROOM_ALIAS_COLORS = [
  '#7dffb8', '#7db8ff', '#ff7db8', '#ffd47d',
  '#b87dff', '#7dffe3', '#ff9d7d', '#d4ff7d',
] as const;

/** localStorage key for the rooms persona (alias + color). */
export const ROOM_PERSONA_KEY = 'rooms:persona';

/** Suggested starter rules for the creation sheet (editable). */
export const ROOM_RULE_SUGGESTIONS = [
  'Be kind — no harassment or hate.',
  'No links.',
  '18+ only.',
] as const;

/** Failure copy per ack/error code — vague by design, never accusatory. */
export const ROOM_FAIL_COPY: Record<string, string> = {
  not_found: 'Room not found.',
  closed: 'This room is closed right now — check back later.',
  banned: 'You are banned from this room.',
  not_joined: 'Join the room first.',
  rate_limited: 'Too many messages — slow down a little.',
  slow_mode: 'Slow down a little.',
  muted: 'You are muted in this room for now.',
  blocked_content: 'That message can’t be posted here.',
  blocked_link: 'Links aren’t allowed here.',
  duplicate: 'You already posted that.',
  spam: 'That looks like spam — try again.',
  forbidden: 'You can’t do that here.',
  locked: 'This room is locked right now.',
  invite_required: 'This room is invite-only — open your invite link.',
  invite_invalid: 'This invite is invalid, expired or used up.',
  unknown: 'Something went wrong.',
};
