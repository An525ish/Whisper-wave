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
