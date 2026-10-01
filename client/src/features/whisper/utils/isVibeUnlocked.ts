import type { AnonMessage } from '../types';

/** Keep in sync with server/src/services/match/vibeEligibility.ts */
export const VIBE_UNLOCK = {
  minSessionMs: 90_000,
  minMessagesPerSide: 2,
  minTotalMessages: 5,
} as const;

/**
 * Is the like/vibe button available yet?
 *
 * The like button is the conversion funnel, so it can't be a
 * tap-30-seconds-in button — that produces mutual-like rates driven by
 * impatience rather than connection. Both people have to have actually
 * participated, and the match has to have had time to breathe.
 */
export const isVibeUnlocked = (
  messages: AnonMessage[],
  matchedAt: number | null,
  now = Date.now()
): boolean => {
  if (!matchedAt) return false;
  if (now - matchedAt < VIBE_UNLOCK.minSessionMs) return false;

  const mine = messages.filter((m) => m.from === 'me').length;
  const theirs = messages.filter((m) => m.from === 'them').length;
  if (mine < VIBE_UNLOCK.minMessagesPerSide || theirs < VIBE_UNLOCK.minMessagesPerSide) {
    return false;
  }
  return messages.length >= VIBE_UNLOCK.minTotalMessages;
};
