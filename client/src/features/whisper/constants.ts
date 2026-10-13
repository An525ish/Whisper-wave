/**
 * Whisper domain constants.
 *
 * Preset vibe tags live HERE and only here. A previous version duplicated this
 * list on the server (`VIBE_TAGS`), and the two drifted apart — "deep_talks" vs
 * "deep talks" — which silently broke vibe-overlap scoring. The server accepts
 * any tag and canonicalises it; this list is a UI suggestion, not a contract.
 */

/** Preset suggestions shown in the picker (canonical underscore form). */
export const ALL_VIBE_TAGS: readonly string[] = [
  'cozy', 'deep_talks', 'gaming', 'chaotic', 'music',
  'overthinker', 'night_owl', 'creative', 'foodie', 'fitness',
  'travel', 'anime', 'movies', 'philosophy', 'memes',
  'coding', 'art', 'sports', 'random',
];

/** Rows of presets visible before the "+N more" toggle. */
export const VISIBLE_PRESETS = 12;

export const MAX_TAGS = 3;
export const MAX_TAG_LENGTH = 20;
export const MAX_DISPLAY_NAME_LENGTH = 24;

/** Mirrors the server cap in `server/src/socket/anon/handlers.ts`. */
export const MAX_MESSAGE_LENGTH = 2000;

/** Debounce before we tell the partner we stopped typing. */
export const TYPING_IDLE_MS = 1500;

/** How long we wait for the server to ack a message before marking it failed. */
export const ACK_TIMEOUT_MS = 8000;

/**
 * sessionStorage key holding a pending connectToken across the auth redirect.
 *
 * Accepted exception to the no-tokens-in-storage rule: the token is short-lived
 * (~10 min), it only lets the holder finish THEIR OWN connection after signing
 * in, and it is removed the moment it is consumed.
 */
export const WHISPER_CONNECT_TOKEN_KEY = 'whisper:connectToken';

/** `location.state.intent` carried to /auth so it can show the whisper-connect copy. */
export const WHISPER_CONNECT_INTENT = 'whisper-connect';

/**
 * Rolling daily whisper allowance for a signed-in account.
 *
 * Keep in sync with `DAILY_WHISPER_LIMIT` in `server/src/services/match/quota.ts`.
 *
 * The server is the only thing that enforces this — the client copy exists so the
 * picker can set an honest expectation rather than let someone discover the limit
 * by being refused. It is deliberately generous (the server test asserts
 * `>= 20`, calling anything tighter "too tight to be invisible to a real user"),
 * because guests are never capped and capping the top of the funnel would be the
 * wrong lever.
 */
export const DAILY_WHISPER_LIMIT = 30;

// ── Vibe gate + clocks ─────────────────────────────────────────────────────

/** Keep in sync with server/src/services/match/vibeEligibility.ts */
export const VIBE_UNLOCK = {
  minSessionMs: 90_000,
  minMessagesPerSide: 2,
  minTotalMessages: 5,
} as const;

/**
 * The thread's own lifetime. Redis holds the session for 24h from creation, so
 * this is a real deadline, not decoration.
 */
export const THREAD_LIFETIME_MS = 24 * 60 * 60 * 1000;

/** How often the elapsed-time stat in the identity panel refreshes. */
export const THREAD_STATS_TICK_MS = 30_000;
/** How often the time-based part of the vibe gate is re-evaluated. */
export const VIBE_GATE_TICK_MS = 5_000;
/** How often the "vanishes in …" line refreshes. */
export const THREAD_EXPIRY_TICK_MS = 60_000;

/**
 * Lifetime of a `connectToken`, used only when the token's own `exp` claim cannot
 * be read. Mirrors the ~10 minute TTL the server signs it with.
 */
export const CONNECT_TOKEN_TTL_MS = 10 * 60 * 1000;
/** Countdown resolution while the mutual-vibe modal is on screen. */
export const CONNECT_COUNTDOWN_TICK_MS = 1_000;
/** Countdown resolution for the collapsed "Open DM" bar. */
export const CONNECT_BAR_TICK_MS = 10_000;

/** No ack for `ANON_LIKE` within this long → roll the heart back (old server / lost ack). */
export const LIKE_ACK_TIMEOUT_MS = 5_000;

/** User-facing copy for a refused like, keyed by the ack `code`. */
export const LIKE_FAIL_COPY: Record<string, string> = {
  locked: 'Still warming up — chat a little longer before sending a vibe.',
  rate_limited: 'Slow down a little, then try again.',
};
export const LIKE_FAIL_FALLBACK = 'Couldn’t send your vibe. Try again.';

/** sessionStorage marker: a match was live in this tab, so a refresh may resume it. */
export const WHISPER_RESUME_KEY = 'whisper:resume';
/** Give up on a refresh-resume if the server hasn't answered by then. */
export const RESUME_DEADLINE_MS = 8_000;
export const RESUME_ENDED_NOTICE = 'That chat has ended.';

/** Shown once per outage when the socket can't reach the server (transport-level failure). */
export const CONNECTION_LOST_NOTICE = "Can't reach the server. Retrying…";
/** Shown when the server refuses the handshake (cookie missing/invalid) — retrying won't help. */
export const CONNECTION_REFUSED_NOTICE = 'Your session could not be verified. Start again.';

/** How long the "saved" confirmation stays up after an identity edit. */
export const SAVED_HINT_MS = 1_600;
/** Debounce for persisting identity edits to localStorage. */
export const IDENTITY_SAVE_DEBOUNCE_MS = 400;

/** Distance from the bottom (px) within which a new message auto-scrolls. */
export const NEAR_BOTTOM_PX = 120;

/** Max characters of free-text detail on an abuse report. */
export const MAX_REPORT_DETAILS = 500;

export const REPORT_REASONS = [
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'harassment', label: 'Harassment or hate' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'underage', label: 'Underage user' },
  { value: 'other', label: 'Something else' },
] as const;

/**
 * Astronomical-style symbols drawn as paths rather than typed as unicode — vector
 * strokes stay sharp at any size and inherit `currentColor`. Venus/Mars/⚧ are all
 * a circle plus strokes. "Prefer not to say" is expressed by selecting nothing.
 */
export const GENDER_OPTIONS = [
  {
    value: 'female',
    label: 'Female',
    icon: { circle: { cx: 12, cy: 8.5, r: 5 }, paths: ['M12 13.5V21', 'M8.5 17.25h7'] },
  },
  {
    value: 'male',
    label: 'Male',
    icon: { circle: { cx: 10, cy: 14, r: 5 }, paths: ['M13.5 10.5L20 4', 'M15.5 4H20v4.5'] },
  },
  {
    value: 'other',
    label: 'Other',
    icon: {
      circle: { cx: 8.5, cy: 16, r: 4.5 },
      paths: ['M11.7 12.8L19.5 5', 'M15 5h4.5v4.5', 'M12.6 8.2l3.7 3.7'],
    },
  },
] as const;

// ── /anon socket protocol ──────────────────────────────────────────────────
// Subset of `server/src/constants/anon-events.ts` that the client uses. The names
// must match the server's exactly; neither side is generated from the other.

// Client → server
export const ANON_MESSAGE = 'ANON_MESSAGE';
export const ANON_TYPING_START = 'ANON_TYPING_START';
export const ANON_TYPING_STOP = 'ANON_TYPING_STOP';
export const ANON_LIKE = 'ANON_LIKE';
export const ANON_NEXT = 'ANON_NEXT'; // skip current match
/** Add or remove one curated reaction on a single message. */
export const ANON_REACT = 'ANON_REACT';

// Server → client
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
export const SESSION_EXPIRED = 'SESSION_EXPIRED'; // identity gone — pick an alias again
export const CONNECTION_READY = 'CONNECTION_READY'; // both sides completed — real DM created
/** Emitted to BOTH participants; `action: 'removed'` means the same reaction was resent. */
export const MATCH_REACTION = 'MATCH_REACTION';

/**
 * The curated reaction set — a whitelist, not an emoji keyboard. The server
 * validates against its own copy (`ANON_REACTIONS` in `server/src/types/match.ts`)
 * and rejects anything else, so this list is presentation, not policy.
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

// ── Analytics event names (emitted via `shared/lib/analytics` `track`) ─────

export const WHISPER_EVENTS = {
  /** User submitted the vibe picker. */
  JOIN: 'whisper_join',
  /** Server confirmed a NEW match (not a reconnect replay). */
  MATCHED: 'whisper_matched',
  /** An outgoing message was actually sent. */
  MESSAGE_SENT: 'whisper_message_sent',
  REACTED: 'whisper_reacted',
  /** A like was emitted to the server (the unlock gate passed). */
  LIKE_SENT: 'whisper_like_sent',
  /** Mutual like achieved — the top of the funnel. */
  MUTUAL: 'whisper_mutual',
  /** A real DM opened — fires once per connection. */
  DM_OPENED: 'whisper_dm_opened',
  /** A guest was sent to /auth to finish connecting. Not a DM open. */
  CONNECT_AUTH_REDIRECT: 'whisper_connect_auth_redirect',
  /** User skipped to the next match. */
  NEXT: 'whisper_next',
  /** Partner ended the session. */
  PARTNER_LEFT: 'whisper_partner_left',
  /** Abuse report filed. */
  REPORT: 'whisper_report',
  /** Match ended — once per session, with durationMs and messageCount. */
  SESSION_END: 'whisper_session_end',
} as const;

// ── Waiting-room radar ─────────────────────────────────────────────────────

/**
 * Where other queued people appear on the waiting-room radar (SVG viewBox 360,
 * centred on 180,180). Every point stays inside the green ring (radius 118) —
 * the radar's edge. One slot is used per *other* person actually queued, so the
 * radar never shows more people than exist — see `WaitingRadar`.
 */
export const RADAR_BLIP_SLOTS = [
  { x: 273.5, y: 234 },
  { x: 86.5, y: 234 },
  { x: 91.5, y: 118 },
  { x: 216.9, y: 78.5 },
  { x: 253.3, y: 153.3 },
  { x: 173.2, y: 257.7 },
] as const;

/** How many chips sit on the radar ring (matches the 3-tag picker limit). */
export const RADAR_FLOAT_MAX_CHIPS = 3;

/**
 * Stand-in labels when the user joined with no vibe tags — soft “signals in
 * the void” so the ring still feels alive without faking their identity.
 */
export const RADAR_WHISPER_CHIPS = [
  'soft static',
  'open channel',
  'night hum',
  'untitled',
  'listening',
  'drift signal',
  'low light',
  'somewhere',
] as const;

// ── Profile rail a11y ──────────────────────────────────────────────────────

/** The "them | you" tabs, referenced by the tab buttons and the panel's `aria-labelledby`. */
export const PROFILE_TAB_IDS = {
  them: 'acp-tab-them',
  you: 'acp-tab-you',
} as const;

/** The single tabpanel the active tab controls. */
export const PROFILE_PANEL_ID = 'acp-tabpanel';

/** The composer textarea — sparks drop an opener into it and focus it. */
export const ANON_COMPOSER_ID = 'acr-composer-input';

/** Under this many messages a thread is "young": openers say "break the ice". */
export const FRESH_THREAD_MESSAGES = 4;
