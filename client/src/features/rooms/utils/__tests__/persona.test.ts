import { describe, expect, it, beforeEach } from 'vitest';
import { defaultColor, readRoomsPersona, saveRoomsPersona, suggestSlug } from '../persona';
import { ROOM_PERSONA_KEY } from '../../constants';

describe('rooms persona', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('assigns deterministic hex colors per alias', () => {
    expect(defaultColor('NightOwl')).toBe(defaultColor('NightOwl'));
    expect(defaultColor('NightOwl')).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('reads a stored persona, repairing bad colors', () => {
    saveRoomsPersona({ alias: 'NightOwl', color: '#zzzzzz' });
    expect(readRoomsPersona()).toEqual({ alias: 'NightOwl', color: defaultColor('NightOwl') });
  });

  it('returns null for missing, blank or corrupt personas', () => {
    expect(readRoomsPersona()).toBeNull();
    localStorage.setItem(ROOM_PERSONA_KEY, JSON.stringify({ alias: '   ' }));
    expect(readRoomsPersona()).toBeNull();
    localStorage.setItem(ROOM_PERSONA_KEY, '{nope');
    expect(readRoomsPersona()).toBeNull();
  });

  it('suggests URL-safe slugs with a uniqueness tail', () => {
    expect(suggestSlug('Midnight Coding!!')).toMatch(/^midnight-coding-[a-z0-9]{4}$/);
    expect(suggestSlug('')).toMatch(/^room-[a-z0-9]{4}$/);
  });
});
