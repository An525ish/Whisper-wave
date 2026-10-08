import { VIBE_UNLOCK } from '../constants';
import type { AnonMessage } from '../types';

/**
 * Is the like/vibe button available yet?
 *
 * The like button is the conversion funnel, so it can't be a
 * tap-30-seconds-in button — that produces mutual-like rates driven by
 * impatience rather than connection. Both people have to have actually
 * participated, and the match has to have had time to breathe.
 *
 * Mirrors the server's gate (server/src/services/match/vibeEligibility.ts), which
 * counts only messages it accepted — so our own `sending`/`failed` bubbles don't
 * count here either.
 */
// TODO(test): no client test runner yet
export const isVibeUnlocked = (
  messages: AnonMessage[],
  matchedAt: number | null,
  now = Date.now()
): boolean => {
  if (!matchedAt) return false;
  if (now - matchedAt < VIBE_UNLOCK.minSessionMs) return false;

  const mine = messages.filter((m) => m.from === 'me' && m.delivery === 'sent').length;
  const theirs = messages.filter((m) => m.from === 'them').length;
  if (mine < VIBE_UNLOCK.minMessagesPerSide || theirs < VIBE_UNLOCK.minMessagesPerSide) {
    return false;
  }
  return mine + theirs >= VIBE_UNLOCK.minTotalMessages;
};
