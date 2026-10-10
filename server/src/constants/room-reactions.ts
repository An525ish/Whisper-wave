/**
 * Curated room reactions — a whitelist, not a string.
 *
 * Same rationale as the whisper set: the client cannot push an arbitrary
 * glyph into a public thread. Small on purpose; every entry must earn its
 * place on a crowded message row.
 */
export const ROOM_REACTIONS = ['heart', 'laugh', 'wow', 'sad', 'fire', 'clap'] as const;

export type RoomReaction = (typeof ROOM_REACTIONS)[number];

/** Display glyphs — the client mirrors this map, never invents its own. */
export const ROOM_REACTION_GLYPHS: Record<RoomReaction, string> = {
  heart: '❤️',
  laugh: '😂',
  wow: '😮',
  sad: '😢',
  fire: '🔥',
  clap: '👏',
};
