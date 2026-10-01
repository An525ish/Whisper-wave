import { useEffect, useState } from 'react';
import { isVibeUnlocked } from '../utils/isVibeUnlocked';
import type { AnonMessage } from '../types';

/** How often to re-evaluate the time-based part of the gate. */
const TICK_MS = 5000;

/**
 * Drives the vibe-unlock gate: whether the like button is available, and
 * whether the one-shot "vibe check" prompt should be showing.
 *
 * Only ticks while the gate is closed — once eligible, there's nothing left to
 * wait for, so the component stops re-rendering.
 */
export function useVibeUnlock(
  messages: AnonMessage[],
  matchedAt: number | null,
  opts: {
    likeSent: boolean;
    mutualLike: boolean;
    partnerVibed: boolean;
    /** The partner left — the thread can no longer become a connection. */
    ended: boolean;
  }
) {
  const [now, setNow] = useState(() => Date.now());
  const vibeUnlocked = isVibeUnlocked(messages, matchedAt, now);

  useEffect(() => {
    if (vibeUnlocked || opts.ended) return;
    const id = window.setInterval(() => setNow(Date.now()), TICK_MS);
    return () => window.clearInterval(id);
  }, [vibeUnlocked, opts.ended]);

  return {
    vibeUnlocked,
    showVibePrompt:
      vibeUnlocked &&
      !opts.ended &&
      !opts.likeSent &&
      !opts.mutualLike &&
      !opts.partnerVibed,
  };
}
