import type { AnonSession, VibeGateInput } from '../../types/match.js';
import { getMessageCounts } from './session.js';

/** Keep in sync with client/src/features/whisper/utils/isVibeUnlocked.ts */
export const VIBE_UNLOCK = {
  minSessionMs: 90_000,
  minMessagesPerSide: 2,
  minTotalMessages: 5,
} as const;

/**
 * Pure eligibility predicate for sending a vibe.
 *
 * The like button is the conversion funnel, so it can't be a tap-30-seconds-in
 * button — that produces mutual-like rates driven by impatience rather than
 * connection. Both people have to have actually participated, and the match has
 * to have had time to breathe.
 *
 * Extracted from the Redis read so it can be unit tested directly.
 */
export const meetsVibeGate = ({
  createdAt,
  countA,
  countB,
  now = Date.now(),
}: VibeGateInput): boolean => {
  if (now - createdAt < VIBE_UNLOCK.minSessionMs) return false;
  if (countA < VIBE_UNLOCK.minMessagesPerSide) return false;
  if (countB < VIBE_UNLOCK.minMessagesPerSide) return false;
  if (countA + countB < VIBE_UNLOCK.minTotalMessages) return false;
  return true;
};

/**
 * Redis-backed wrapper used by the ANON_LIKE handler.
 *
 * Reads the per-side counters, NOT the buffered messages: the buffer is capped at
 * the last 50, so a long chat would shed its early messages and a gate computed
 * from it could re-lock itself.
 */
export async function isVibeUnlocked(
  sessionId: string,
  session: AnonSession
): Promise<boolean> {
  const { countA, countB } = await getMessageCounts(sessionId);
  return meetsVibeGate({ createdAt: session.createdAt, countA, countB });
}
