import type { AnonMessage, ThreadStats, VibeTag } from '../types';

/**
 * Derive the "this thread" summary.
 *
 * Pure so it can be unit tested and so the component stays presentational.
 * `matchedAt` is null when there is no live thread, which yields zeros rather
 * than a bogus "0 minutes" — the caller decides whether to render at all.
 */
export const threadStats = (
  messages: AnonMessage[],
  myTags: VibeTag[],
  partnerTags: VibeTag[],
  matchedAt: number | null,
  now: number
): ThreadStats => {
  const mine = messages.filter((m) => m.from === 'me').length;
  const theirs = messages.length - mine;

  const partnerSet = new Set(partnerTags.map((t) => t.toLowerCase()));
  const sharedTags = myTags.filter((t) => partnerSet.has(t.toLowerCase()));

  return {
    minutes: matchedAt ? Math.max(0, Math.floor((now - matchedAt) / 60_000)) : 0,
    totalMessages: messages.length,
    myMessages: mine,
    theirMessages: theirs,
    sharedTags,
  };
};
