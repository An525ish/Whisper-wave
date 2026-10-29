/**
 * Room reactions are any single emoji, checked by shape (`isReactionEmoji` in
 * `anon-reactions.ts`), the same rule as anonymous chat. The cap below stops one
 * message from collecting an endless spread of different emoji.
 */
export const ROOM_REACTION_KINDS_MAX = 24;
