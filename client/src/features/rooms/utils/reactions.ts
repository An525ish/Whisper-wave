import { ROOM_REACTION_GLYPHS } from '../constants';
import type { RoomMessage, RoomReactionKey } from '../types';

export const ROOM_REACTION_KEYS = Object.keys(ROOM_REACTION_GLYPHS) as RoomReactionKey[];

export const isReactionKey = (value: string): value is RoomReactionKey => value in ROOM_REACTION_GLYPHS;

export const reactionGlyph = (key: RoomReactionKey): string => ROOM_REACTION_GLYPHS[key];

/** Reactions that have a count, in the picker's fixed order (never unknown keys). */
export const usedReactions = (message: RoomMessage): Array<{ key: RoomReactionKey; count: number }> =>
  ROOM_REACTION_KEYS.flatMap((key) => {
    const count = message.reactions?.[key] ?? 0;
    return count > 0 ? [{ key, count }] : [];
  });
