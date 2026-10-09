import { THREAD_STATS_TICK_MS } from '../constants';
import { useAnonStore } from '../stores/anonStore';
import { threadStats } from '../utils/threadStats';
import { useNowWhile } from './useNowWhile';
import type { ThreadStats, VibeTag } from '../types';

/**
 * Live summary of the current thread for the identity panel. The clock comes from
 * `useNowWhile` because `Date.now()` during render is impure; it only ticks while
 * there is a thread.
 */
export function useThreadStats(myTags: VibeTag[], active: boolean): ThreadStats | null {
  const messages = useAnonStore((s) => s.messages);
  const partnerTags = useAnonStore((s) => s.partnerTags);
  const matchedAt = useAnonStore((s) => s.matchedAt);
  const endedAt = useAnonStore((s) => s.endedAt);
  const now = useNowWhile(active, THREAD_STATS_TICK_MS);

  if (!active) return null;
  // Once the partner has left the thread is over: freeze its length there
  // instead of letting "together" keep counting up.
  return threadStats(messages, myTags, partnerTags, matchedAt, endedAt ?? now);
}
