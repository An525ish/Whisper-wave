/**
 * The curated reaction set, and the only one the server will accept.
 *
 * A fixed list on purpose: accepting arbitrary emoji from the client means any
 * glyph at all can be rendered inside someone else's bubble, which is a
 * moderation surface with no moderation. Keep it small and on-brand — this is a
 * curated Gen Z set, not an emoji keyboard.
 *
 * These are stable wire keys, not glyphs. The client owns the presentation, so a
 * new reaction is a new key here and a new glyph there.
 *
 * Mirrored by the client's `ANON_REACTIONS` in
 * `client/src/shared/constants/anonEvents.ts`; one source, referenced from the
 * other side in a comment.
 */
export const ANON_REACTIONS = ['fire', 'slay', 'dead', 'fr', 'peak', 'lit'] as const;
