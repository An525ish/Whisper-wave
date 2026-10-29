/**
 * Room tuning — one home for the numbers every room surface shares.
 *
 * Caps live on the template (official rooms may differ); these are the
 * defaults for created rooms and the seed. Everything is deliberately small:
 * a room of 300 is a stream, not a conversation.
 */
export const ROOM_CAP_SOFT = 60;
export const ROOM_CAP_HARD = 100;

/** Live messages kept per instance. Restart wipes them — rooms are ephemeral. */
export const ROOM_MSG_RING = 100;

/** Slow mode between accepted posts: guests 3 s, members 2 s. */
export const ROOM_SLOW_GUEST_MS = 3_000;
export const ROOM_SLOW_MEMBER_MS = 2_000;

/** A message with this many distinct reporters hides pending review. */
export const ROOM_AUTOHIDE_REPORTERS = 3;

/** Active user-created rooms one account may host at a time. */
export const ROOM_MAX_PER_USER = 5;

/**
 * Private rooms (HUB_PLAN §7.3): invite-only AND members-only, small, ephemeral.
 * Server-enforced regardless of input — the client mirrors these for copy only.
 */
export const PRIVATE_ROOM_CAP_SOFT = 20;
export const PRIVATE_ROOM_CAP_HARD = 25;
export const PRIVATE_ROOM_MAX_PER_USER = 3;
export const PRIVATE_INVITE_MAX_USES = 25;
export const PRIVATE_INVITE_MAX_TTL_DAYS = 30;
/** A private room with no join for this long is deleted (with its invites). */
export const PRIVATE_ROOM_IDLE_DAYS = 30;

/** Bump when the room-rules copy creators accept changes (stored per room). */
export const ROOM_RULES_VERSION = 1;

/** Slugs user rooms may never take — routes, staff and trust-bait names. */
export const ROOM_RESERVED_SLUGS: readonly string[] = [
  'new', 'admin', 'administrator', 'mod', 'mods', 'moderator', 'wave', 'whisper', 'api', 'rooms',
  'room', 'official', 'public', 'private', 'unlisted', 'support', 'help', 'report', 'reports',
  'safety', 'terms', 'privacy', 'legal', 'security', 'staff', 'team', 'system', 'root',
  'lobby', 'login', 'signup', 'settings', 'about', 'contact', 'abuse', 'trust',
];

/** Hard cap on lines per message — a wall of newlines is a flood, not chat. */
export const ROOM_MAX_LINES = 6;

/** Listening rooms: how long the room stays "staffed" after the LAST mod leaves (refresh / flaky network). */
export const ROOM_MOD_GRACE_MS = 3 * 60_000;
/** Listening rooms: at most one "mod needed" push per mod per room inside this window. */
export const ROOM_MOD_NUDGE_THROTTLE_MS = 10 * 60_000;

/**
 * Media a room may allow (admin-set per room, members only). `image` is an R2
 * upload; `gif` is a KLIPY link; `meme` is a Memegen link. Video, audio and
 * documents are not offered in rooms.
 */
export const ROOM_MEDIA_KINDS = ['image', 'gif', 'meme'] as const;
export const ROOM_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ROOM_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
/** Photos one person may sign per minute in a room. */
export const ROOM_IMAGE_SIGNS_PER_MIN = 6;
