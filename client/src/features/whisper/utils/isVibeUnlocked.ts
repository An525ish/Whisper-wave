import { VIBE_UNLOCK } from '../constants';
import type { AnonMessage } from '../types';

/**
 * Milliseconds of real back-and-forth so far.
 *
 * Time only accrues when someone replies to the OTHER side within `maxGapMs`.
 * A monologue, long silences, or a ping every ten minutes add nothing, and the
 * clock simply pauses (it never resets). Mirrors the server
 * (server/src/services/match/vibeEligibility.ts), which counts only messages it
 * accepted, so our own `sending`/`failed` bubbles don't count here either.
 */
export const engagedMs = (messages: AnonMessage[]): number => {
  let total = 0;
  let prev: AnonMessage | null = null;
  for (const m of messages) {
    if (m.from === 'me' && m.delivery !== 'sent') continue;
    if (prev && prev.from !== m.from) {
      const gap = m.sentAt - prev.sentAt;
      if (gap > 0 && gap <= VIBE_UNLOCK.maxGapMs) total += gap;
    }
    prev = m;
  }
  return total;
};

/** How close the vibe gate is to opening, 0-1. Drives the header ring and the locked modal wording. */
export const vibeProgress = (messages: AnonMessage[]): number =>
  Math.min(1, engagedMs(messages) / VIBE_UNLOCK.engagedMs);

/** Is the like/vibe button available yet? */
export const isVibeUnlocked = (messages: AnonMessage[]): boolean => vibeProgress(messages) >= 1;
