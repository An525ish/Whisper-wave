import { EFFORT_UNLOCK, VIBE_UNLOCK } from '../constants';
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

/**
 * One-sided path: how close THEIR run of real messages is to unlocking your vibe, 0-1.
 * Same rules as the server's `nextEffort`: text only, long enough, not a repeat of the
 * previous counted line, and spread over a minimum span.
 */
export const effortProgress = (messages: AnonMessage[]): number => {
  let n = 0;
  let first = 0;
  let last = 0;
  let prev = '';
  for (const m of messages) {
    if (m.from !== 'them' || m.image) continue;
    const text = m.content.toLowerCase().replace(/\s+/g, ' ').trim();
    if (text.length < EFFORT_UNLOCK.minChars || text === prev) continue;
    prev = text;
    n += 1;
    first ||= m.sentAt;
    last = m.sentAt;
  }
  return Math.min(1, n / EFFORT_UNLOCK.messages, (last - first) / EFFORT_UNLOCK.spanMs);
};

/** How close the vibe gate is to opening, 0-1: whichever path is further along. */
export const vibeProgress = (messages: AnonMessage[]): number =>
  Math.max(Math.min(1, engagedMs(messages) / VIBE_UNLOCK.engagedMs), effortProgress(messages));

/** Is the like/vibe button available yet? */
export const isVibeUnlocked = (messages: AnonMessage[]): boolean => vibeProgress(messages) >= 1;
