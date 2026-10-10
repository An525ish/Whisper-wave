import { ROOM_ALIAS_COLORS, ROOM_PERSONA_KEY } from '../constants';

export type RoomsPersona = {
  alias: string;
  color: string;
};

/** The rooms persona: alias + color, per browser. Defaults to a stable color. */
export const readRoomsPersona = (): RoomsPersona | null => {
  try {
    const raw = localStorage.getItem(ROOM_PERSONA_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RoomsPersona>;
    if (typeof parsed.alias !== 'string' || parsed.alias.trim().length === 0) return null;
    return {
      alias: parsed.alias.trim().slice(0, 24),
      color:
        typeof parsed.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(parsed.color)
          ? parsed.color
          : defaultColor(parsed.alias),
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

export const defaultColor = (alias: string): string => {
  let hash = 0;
  for (let i = 0; i < alias.length; i += 1) {
    hash = (hash * 31 + alias.charCodeAt(i)) >>> 0;
  }
  return ROOM_ALIAS_COLORS[hash % ROOM_ALIAS_COLORS.length] ?? '#7dffb8';
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
