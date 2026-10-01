import { useEffect, useState } from 'react';
import { useAnonStore } from '../stores/anonStore';
import { threadStats, type ThreadStats } from '../utils/threadStats';
import type { VibeTag } from '../types';

/** How often the elapsed-time stat refreshes. */
const TICK_MS = 30_000;

/**
 * Live summary of the current thread for the identity panel.
 *
 * The clock lives here rather than in the component because `Date.now()` during
 * render is impure — the value would change on any unrelated re-render. Ticking
 * only while there is a thread keeps the panel off the render path entirely
 * otherwise.
 */
export function useThreadStats(
  myTags: VibeTag[],
  active: boolean
): ThreadStats | null {
  const messages = useAnonStore((s) => s.messages);
  const partnerTags = useAnonStore((s) => s.partnerTags);
  const matchedAt = useAnonStore((s) => s.matchedAt);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [active]);

  if (!active) return null;
  return threadStats(messages, myTags, partnerTags, matchedAt, now);
}