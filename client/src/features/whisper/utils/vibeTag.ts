import { MAX_TAG_LENGTH } from '../constants';

/**
 * Canonical form of a vibe tag.
 *
 * Mirrors `normalizeVibeTag` in server/src/types/match.ts EXACTLY. If these two
 * drift, vibe-overlap scoring silently stops matching — which is what happened
 * when a separate server-side preset list was kept.
 */
export const normalizeVibeTag = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .replace(/[\s._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, MAX_TAG_LENGTH);

/** Human-readable form for display. */
export const vibeTagLabel = (tag: string): string => tag.replace(/_/g, ' ');

/**
 * Hue (0–359) derived from the alias. The single seed for everything coloured by
 * identity — the avatar gradient and the profile banner — so they always agree.
 */
const aliasHue = (name: string): number => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i) * 13) % 360;
  return h;
};

/**
 * Deterministic gradient for an anonymous avatar, derived from the alias.
 * Same name always yields the same colour, so a partner's "identity" is visually
 * stable across a session without revealing anything.
 */
export const avatarGradient = (name: string): string => {
  const h = aliasHue(name);
  return `linear-gradient(145deg, hsl(${h} 55% 48%) 0%, hsl(${(h + 40) % 360} 45% 28%) 100%)`;
};
