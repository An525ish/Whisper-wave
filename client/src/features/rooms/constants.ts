/**
 * Rooms domain constants. Socket event names live in `shared/constants/socket.ts`
 * (`ROOM_SOCKET`); numeric limits mirror the server's room validators.
 */
import type { RoomAckCode, RoomEndKind, RoomsFilter } from './types';

/** Analytics event names (emitted via `shared/lib/analytics` `track`). */
export const ROOM_EVENTS = {
  LOBBY_VIEW: 'room_lobby_view',
  JOIN: 'room_join',
  MESSAGE_SENT: 'room_message_sent',
  LEAVE: 'room_leave',
  REPORT: 'room_report',
  CREATED: 'room_created',
  MOD_ACTION: 'room_mod_action',
  CHALLENGE_SHOWN: 'room_challenge_shown',
  CHALLENGE_PASSED: 'room_challenge_passed',
  CHALLENGE_FAILED: 'room_challenge_failed',
} as const;

/**
 * Curated reactions: KEY → glyph. The server accepts only these keys
 * (`server/src/constants/room-reactions.ts`), so the wire always carries the key.
 */
export const ROOM_REACTION_GLYPHS = {
  heart: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  fire: '🔥',
  clap: '👏',
} as const;

/** Persona color choices for the pre-join sheet (server accepts any hex). */
export const ROOM_ALIAS_SWATCHES = [
  { hex: '#7dffb8', name: 'Mint' },
  { hex: '#7db8ff', name: 'Sky' },
  { hex: '#ff7db8', name: 'Rose' },
  { hex: '#ffd47d', name: 'Amber' },
  { hex: '#b87dff', name: 'Violet' },
  { hex: '#7dffe3', name: 'Aqua' },
  { hex: '#ff9d7d', name: 'Coral' },
  { hex: '#d4ff7d', name: 'Lime' },
] as const;

export const ROOM_ALIAS_COLORS: readonly string[] = ROOM_ALIAS_SWATCHES.map((s) => s.hex);

export const ROOM_DEFAULT_COLOR = ROOM_ALIAS_SWATCHES[0].hex;

/** localStorage key for the rooms persona (alias + color). */
export const ROOM_PERSONA_KEY = 'rooms:persona';

/** Suggested starter rules for the creation sheet (editable). */
export const ROOM_RULE_SUGGESTIONS = [
  'Be kind — no harassment or hate.',
  'No links.',
  '18+ only.',
] as const;

/** Field and payload limits — mirror `server/src/validators/rooms.ts`. */
export const ROOM_LIMITS = {
  MESSAGE_MAX: 1000,
  ALIAS_MAX: 24,
  TITLE_MAX: 60,
  SLUG_MAX: 40,
  DESCRIPTION_MAX: 280,
  RULE_MAX: 140,
  CREATE_RULES_MAX: 6,
  EDIT_RULES_MAX: 10,
  REPORT_DETAILS_MAX: 500,
  CHALLENGE_ANSWER_MAX: 12,
} as const;

/** Messages the store keeps — mirrors the server ring (`ROOM_MSG_RING`). */
export const ROOM_THREAD_CAP = 100;

export const ROOM_DEFAULT_LANG = 'en';

/** Same author within this window shares one avatar/name head. */
export const ROOM_GROUP_WINDOW_MS = 5 * 60 * 1000;

/** Quoted-reply and composer reply previews are cut here. */
export const ROOM_PREVIEW_MAX = 60;

/** Within this many px of the bottom the thread keeps following new messages. */
export const ROOM_STICK_THRESHOLD_PX = 120;

/** A mod-menu "Mute" lasts this long (server default 10). */
export const ROOM_MUTE_MINUTES = 10;

/** Mod-menu "Slow mode" window. */
export const ROOM_SLOW_MODE_MS = 5000;

/** Invite links stay valid this long (server-side). */
export const ROOM_INVITE_DAYS = 7;

/** Private-room limits — mirror `server/src/constants/rooms.ts` (server enforces; this is copy and form bounds). */
export const ROOM_PRIVATE = {
  MAX_PEOPLE: 25,
  MAX_PER_USER: 3,
  INVITE_MAX_USES: 25,
  INVITE_DEFAULT_USES: 10,
  INVITE_MAX_DAYS: 30,
  INVITE_DEFAULT_DAYS: 7,
} as const;

/** Create-sheet copy for the two-way choice and its unavailable states. */
export const ROOM_VISIBILITY_COPY = {
  public: {
    title: 'Public (request listing)',
    sub: 'Anyone with the link can join, guests included. Ask the Wave team to list it in the lobby.',
  },
  private: {
    title: `Private — invite-only, up to ${ROOM_PRIVATE.MAX_PEOPLE} people, members only`,
    sub: 'Only signed-in people holding your invite link get in. Never in the lobby, never searchable. Deleted after 30 quiet days.',
  },
  flag_off: 'Private rooms are switched off right now.',
  not_entitled: 'Private rooms open up once your account has been around for a week with a clean record.',
  limit: `You already host ${ROOM_PRIVATE.MAX_PER_USER} private rooms — delete one to make another.`,
} as const;

/** Lobby poll + freshness windows. */
export const ROOM_LIST_STALE_MS = 10_000;
export const ROOM_LIST_POLL_MS = 20_000;
export const ROOM_INFO_STALE_MS = 30_000;
export const ROOM_INVITES_STALE_MS = 30_000;

/** How often the composer's slow-mode / mute countdown re-reads the clock. */
export const ROOM_COUNTDOWN_TICK_MS = 500;

/** Longest wait before an unanswered emit is treated as failed. */
export const ROOM_ACK_TIMEOUT_MS = 10_000;


/** Local-only notice author (kick notices). Never sent by the server. */
export const ROOM_NOTICE_FROM = { alias: 'Wave', color: '#8b6bff', role: 'member' } as const;

export const ROOM_FILTERS: Array<{ id: RoomsFilter; label: string }> = [
  { id: 'all', label: 'All rooms' },
  { id: 'open', label: 'Open now' },
  { id: 'live', label: 'With people' },
  { id: 'later', label: 'Opening later' },
];

/** Reasons offered on the report sheet. */
export const ROOM_REPORT_REASONS = [
  { id: 'inappropriate_content', label: 'Inappropriate content' },
  { id: 'harassment', label: 'Harassment or hate' },
  { id: 'spam', label: 'Spam or scam' },
  { id: 'underage', label: 'Possibly underage' },
  { id: 'other', label: 'Something else' },
] as const;

export const ROOM_DEFAULT_REPORT_REASON = 'harassment';

/** Failure copy per `RoomAckCode` — vague by design, never accusatory. */
export const ROOM_FAIL_COPY: Record<RoomAckCode, string> = {
  blocked_content: 'That message can’t be posted here.',
  blocked_link: 'Links aren’t allowed here.',
  slow_mode: 'Slow down a little.',
  duplicate: 'You already posted that.',
  spam: 'That looks like spam — try again.',
  muted: 'You are muted in this room for now.',
  mod_absent: 'A moderator isn’t here right now. Posting resumes when one arrives.',
  feature_off: 'Rooms are switched off right now.',
  identity_required: 'Open Whisper Wave once, then come back to join rooms.',
  members_only: 'This private room is for signed-in members — sign in to join.',
  not_found: 'Room not found — or that invite is invalid, expired or used up.',
  closed: 'This room is closed right now — check back later.',
  banned: 'You can’t join this room right now.',
  not_joined: 'Join the room first.',
  rate_limited: 'Too many tries — slow down a little.',
  locked: 'This room is locked right now.',
  forbidden: 'You can’t do that here.',
  invalid_payload: 'That didn’t go through — try again.',
  alias_invalid: 'That display name can’t be used — pick another.',
  join_in_progress: 'Already joining — one moment.',
  challenge_required: 'Quick check first — answer to post.',
  challenge_failed: 'That check didn’t go through — try again.',
  challenge_unavailable: 'The check is unavailable right now — try again in a moment.',
  unknown: 'Something went wrong.',
};

/** Full-page state cards: copy per end-state kind. */
export const ROOM_END_COPY: Record<RoomEndKind, { title: string; sub: string }> = {
  kicked: {
    title: 'You were removed',
    sub: 'A short cooldown came with it. Take a breath — try again a little later.',
  },
  banned: { title: 'You can’t join this room', sub: 'You are banned from here for now.' },
  closed: { title: 'This room closed', sub: 'This room is closed right now — check back later.' },
  not_found: { title: 'Room not found', sub: 'It may have been removed — or the link is wrong.' },
  switched_off: { title: 'Rooms are switched off right now', sub: 'They’ll be back — check again soon.' },
  restarted: { title: 'We restarted', sub: 'History reset — rejoin to pick up where you were.' },
  identity_required: {
    title: 'One more step',
    sub: 'Open Whisper Wave once, then come back to join rooms.',
  },
};

export const ROOM_SUPPORT_COPY = {
  title: 'You don’t have to carry this alone.',
  body: 'If you might act on these thoughts, please reach out right now — a local crisis helpline or emergency number. Your message was still posted; this is only ever shown to you, never a punishment.',
} as const;

/** Listening rooms (Venting): the always-on safety strip and the paused-thread lines. */
export const ROOM_LISTENING_COPY = {
  strip: 'Not a crisis service. If you might act on your thoughts, contact a local helpline now.',
  stripAction: 'Helplines',
  paused: 'A moderator isn’t here right now. Posting resumes when one arrives.',
  resumed: 'A moderator is here. You can post again.',
  composerPaused: 'Waiting for a moderator…',
  lobbyLabel: 'Waiting for a moderator',
} as const;

/** Emoji popover geometry (desktop fixed width; mobile fits the viewport). */
export const ROOM_EMOJI_WIDTH_PX = 280;
export const ROOM_EMOJI_MIN_WIDTH_PX = 260;
export const ROOM_EMOJI_HEIGHT_PX = 320;
export const ROOM_EMOJI_VIEWPORT_PAD_PX = 16;

/** The lobby re-reads the clock this often so "Opens …" labels stay right. */
export const ROOM_LOBBY_CLOCK_MS = 60_000;
