import type { AnonMessage, VibeTag } from '../types';

/** What the panel shows about the thread you're currently in (or just left). */
export type ThreadStats = {
  /** Whole minutes in the thread, floored. */
  minutes: number;
  totalMessages: number;
  myMessages: number;
  theirMessages: number;
  /** Tags both sides picked — the thing that made the match plausible. */
  sharedTags: VibeTag[];
};

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

  const theirs_ = new Set(partnerTags.map((t) => t.toLowerCase()));
  const sharedTags = myTags.filter((t) => theirs_.has(t.toLowerCase()));

  return {
    minutes: matchedAt ? Math.max(0, Math.floor((now - matchedAt) / 60_000)) : 0,
    totalMessages: messages.length,
    myMessages: mine,
    theirMessages: theirs,
    sharedTags,
  };
};

/** "4 min together" / "just met" — the panel's headline stat. */
export const formatDuration = (minutes: number): string => {
  if (minutes < 1) return 'Just met';
  return `${minutes} min together`;
};