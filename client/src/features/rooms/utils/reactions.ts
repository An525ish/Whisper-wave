import type { RoomMessage, RoomReactionKey } from '../types';

/** Emoji that have a count on this message, most used first (ties keep arrival order). */
export const usedReactions = (message: RoomMessage): Array<{ key: RoomReactionKey; count: number }> =>
  Object.entries(message.reactions ?? {})
    .filter(([, count]) => count > 0)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
