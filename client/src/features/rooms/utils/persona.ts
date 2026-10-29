import { ROOM_ALIAS_COLORS, ROOM_DEFAULT_COLOR, ROOM_LIMITS, ROOM_PERSONA_KEY } from '../constants';
import type { RoomsPersona } from '../types';

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Stable color per alias — the same name always gets the same swatch. */
export const defaultColor = (alias: string): string => {
  let hash = 0;
  for (let i = 0; i < alias.length; i += 1) {
    hash = (hash * 31 + alias.charCodeAt(i)) >>> 0;
  }
  return ROOM_ALIAS_COLORS[hash % ROOM_ALIAS_COLORS.length] ?? ROOM_DEFAULT_COLOR;
};

/** The rooms persona: alias + color, per browser. Repairs a bad stored color. */
export const readRoomsPersona = (): RoomsPersona | null => {
  try {
    const raw = localStorage.getItem(ROOM_PERSONA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RoomsPersona>;
    if (typeof parsed.alias !== 'string' || parsed.alias.trim().length === 0) return null;
    const alias = parsed.alias.trim().slice(0, ROOM_LIMITS.ALIAS_MAX);
    return {
      alias,
      color: typeof parsed.color === 'string' && HEX_COLOR.test(parsed.color) ? parsed.color : defaultColor(alias),
    };
  } catch {
    return null;
  }
};

export const saveRoomsPersona = (persona: RoomsPersona): void => {
  try {
    localStorage.setItem(ROOM_PERSONA_KEY, JSON.stringify(persona));
  } catch {
    // Private mode etc. — the join form still works, it just won't remember.
  }
};

/**
 * One persona per person (HUB_PLAN §6.4): the Whisper alias, when there is one,
 * wins over the rooms copy (editing it in either place edits the same thing);
 * the color is the rooms-only half and survives, or follows the alias.
 */
export const mergePersona = (rooms: RoomsPersona | null, whisperAlias: string | null): RoomsPersona | null => {
  const alias = whisperAlias?.trim().slice(0, ROOM_LIMITS.ALIAS_MAX) || rooms?.alias || '';
  if (!alias) return null;
  return { alias, color: rooms?.color ?? defaultColor(alias) };
};

/** URL-safe slug suggestion: title words + short random tail (uniqueness). */
export const suggestSlug = (title: string): string => {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 3)
    .join('-');
  const tail = Math.random().toString(36).slice(2, 6);
  return `${words || 'room'}-${tail}`;
};
