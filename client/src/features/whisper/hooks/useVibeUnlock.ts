import { vibeProgress } from '../utils/isVibeUnlocked';
import type { AnonMessage } from '../types';

interface Params {
  likeSent: boolean;
  mutualLike: boolean;
  partnerVibed: boolean;
  /** The partner left, so the thread can no longer become a connection. */
  ended: boolean;
}

/**
 * Drives the vibe-unlock gate: whether the like button is available, how close it
 * is to opening (for the header's progress ring), and whether the one-shot "vibe
 * check" prompt should be showing. Progress only changes when a message lands, so
 * there is no clock to tick.
 */
export function useVibeUnlock(
  messages: AnonMessage[],
  { likeSent, mutualLike, partnerVibed, ended }: Params
) {
  const progress = vibeProgress(messages);
  const vibeUnlocked = progress >= 1;
  return {
    vibeUnlocked,
    vibeProgress: progress,
    showVibePrompt: vibeUnlocked && !ended && !likeSent && !mutualLike && !partnerVibed,
  };
}
