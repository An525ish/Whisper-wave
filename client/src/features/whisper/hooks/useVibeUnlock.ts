import { useState } from 'react';
import { VIBE_GATE_TICK_MS } from '../constants';
import { isVibeUnlocked } from '../utils/isVibeUnlocked';
import { useNowWhile } from './useNowWhile';
import type { AnonMessage } from '../types';

interface Params {
  likeSent: boolean;
  mutualLike: boolean;
  partnerVibed: boolean;
  /** The partner left — the thread can no longer become a connection. */
  ended: boolean;
}

/**
 * Drives the vibe-unlock gate: whether the like button is available, and
 * whether the one-shot "vibe check" prompt should be showing.
 *
 * The clock only ticks while the gate is closed and the thread is live — once
 * eligible there is nothing left to wait for.
 */
export function useVibeUnlock(
  messages: AnonMessage[],
  matchedAt: number | null,
  { likeSent, mutualLike, partnerVibed, ended }: Params
) {
  // Mirror of the gate, adjusted during render, so the clock can stop once open.
  const [gateOpen, setGateOpen] = useState(false);
  const now = useNowWhile(!ended && !gateOpen, VIBE_GATE_TICK_MS);
  const vibeUnlocked = isVibeUnlocked(messages, matchedAt, now);
  if (vibeUnlocked !== gateOpen) setGateOpen(vibeUnlocked);

  return {
    vibeUnlocked,
    showVibePrompt: vibeUnlocked && !ended && !likeSent && !mutualLike && !partnerVibed,
  };
}
