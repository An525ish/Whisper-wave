import type { VibeOverlap, VibeTag } from '../types';

/**
 * Split two tag lists into shared / only-mine / only-theirs.
 *
 * Matching is case-insensitive (the server normalises, but a stale client copy
 * must not turn "Music" and "music" into two different vibes). Shared tags keep
 * the caller's casing, like `threadStats`.
 */
export const vibeOverlap = (mine: VibeTag[], theirs: VibeTag[]): VibeOverlap => {
  const theirSet = new Set(theirs.map((t) => t.toLowerCase()));
  const mineSet = new Set(mine.map((t) => t.toLowerCase()));

  return {
    shared: mine.filter((t) => theirSet.has(t.toLowerCase())),
    onlyMine: mine.filter((t) => !theirSet.has(t.toLowerCase())),
    onlyTheirs: theirs.filter((t) => !mineSet.has(t.toLowerCase())),
  };
};
