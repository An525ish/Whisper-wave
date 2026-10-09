import { VIBE_UNLOCK } from '../constants';
import type { AnonMessage } from '../types';

/**
 * How close the vibe gate is to opening, 0–1.
 *
 * The like button is the conversion funnel, so it can't be a tap-30-seconds-in
 * button — that produces mutual-like rates driven by impatience rather than
 * connection. Both people have to have actually participated, and the match has
 * to have had time to breathe. The gate is an AND of four conditions, so progress
 * is the *slowest* of them: it reaches 1 at exactly the moment the gate opens, and
 * never shows a bar that is full while something is still missing.
 *
 * Mirrors the server's gate (server/src/services/match/vibeEligibility.ts), which
 * counts only messages it accepted — so our own `sending`/`failed` bubbles don't
 * count here either.
 */
export const vibeProgress = (
  messages: AnonMessage[],
  matchedAt: number | null,
  now = Date.now()
): number => {
  if (!matchedAt) return 0;

  const mine = messages.filter((m) => m.from === 'me' && m.delivery === 'sent').length;
  const theirs = messages.filter((m) => m.from === 'them').length;

  const slowest = Math.min(
    (now - matchedAt) / VIBE_UNLOCK.minSessionMs,
    mine / VIBE_UNLOCK.minMessagesPerSide,
    theirs / VIBE_UNLOCK.minMessagesPerSide,
    (mine + theirs) / VIBE_UNLOCK.minTotalMessages
  );

  return Math.max(0, Math.min(1, slowest));
};

// TODO(test): no client test runner yet
/** Is the like/vibe button available yet? */
export const isVibeUnlocked = (
  messages: AnonMessage[],
  matchedAt: number | null,
  now = Date.now()
): boolean => vibeProgress(messages, matchedAt, now) >= 1;
