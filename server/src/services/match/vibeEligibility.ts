import type { AnonSession, VibeGateInput } from '../../types/match.js';
import { getEngagedMs } from './session.js';

/** Keep in sync with client/src/features/whisper/constants.ts */
export const VIBE_UNLOCK = {
  /** Time spent actually going back and forth before vibes open. */
  engagedMs: 5 * 60_000,
  /** A reply later than this does not count toward the flow (the clock just pauses). */
  maxGapMs: 60_000,
  /** The client stamps its own sends with its own clock; forgive that skew. */
  skewMs: 5_000,
} as const;

export type Engagement = { engagedMs: number; lastAt: number; lastFrom: string };

/**
 * Fold one accepted message into the running "conversation flow" total.
 * Time only accrues when someone REPLIES to the other side within `maxGapMs`,
 * so a monologue, long silences, or one-word pings spread across an hour never
 * unlock anything, and nobody can rush it by spamming.
 */
export const nextEngagement = (prev: Engagement | null, from: string, at: number): Engagement => {
  let engagedMs = prev?.engagedMs ?? 0;
  if (prev && prev.lastFrom !== from) {
    const gap = at - prev.lastAt;
    if (gap > 0 && gap <= VIBE_UNLOCK.maxGapMs) engagedMs += gap;
  }
  return { engagedMs, lastAt: at, lastFrom: from };
};

/** Pure predicate, unit-testable without Redis. */
export const meetsVibeGate = ({ engagedMs }: VibeGateInput): boolean =>
  engagedMs >= VIBE_UNLOCK.engagedMs - VIBE_UNLOCK.skewMs;

/** Redis-backed wrapper used by the ANON_LIKE handler. */
export async function isVibeUnlocked(sessionId: string, _session?: AnonSession): Promise<boolean> {
  return meetsVibeGate({ engagedMs: await getEngagedMs(sessionId) });
}
