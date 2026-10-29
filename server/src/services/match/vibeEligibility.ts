import type { AnonSession, VibeGateInput } from '../../types/match.js';
import { getEffort, getEngagedMs } from './session.js';

/** Keep in sync with client/src/features/whisper/constants.ts */
export const VIBE_UNLOCK = {
  /** Time spent actually going back and forth before vibes open. */
  engagedMs: 30_000, // TEMP: testing, restore to 5 * 60_000
  /** A reply later than this does not count toward the flow (the clock just pauses). */
  maxGapMs: 60_000,
  /** The client stamps its own sends with its own clock; forgive that skew. */
  skewMs: 5_000,
} as const;

/**
 * One-sided effort: the person RECEIVING a run of real messages may send a vibe
 * even if they barely replied. It only ever unlocks the receiver's button (never
 * the sender's), so spamming gains the sender nothing.
 */
export const EFFORT_UNLOCK = {
  /** Accepted, distinct, text-only messages of at least `minChars`. */
  messages: 15,
  minChars: 15,
  /** First to last counted message: a flood in 30 seconds is not effort. */
  spanMs: 2 * 60_000,
} as const;

export type Effort = { n: number; firstAt: number; lastAt: number; last: string };

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Fold one accepted message into its sender's effort tally. Photos, short lines
 * and a repeat of the previous counted line are ignored.
 * ponytail: only the previous line is compared, so alternating two texts slips by.
 * Upgrade: keep a small set of recent hashes per sender.
 */
export const nextEffort = (prev: Effort | null, content: string, hasImage: boolean, at: number): Effort | null => {
  const text = norm(content);
  if (hasImage || text.length < EFFORT_UNLOCK.minChars || text === prev?.last) return prev;
  return { n: (prev?.n ?? 0) + 1, firstAt: prev?.firstAt ?? at, lastAt: at, last: text };
};

export const meetsEffortGate = (e: Effort | null): boolean =>
  !!e && e.n >= EFFORT_UNLOCK.messages && e.lastAt - e.firstAt >= EFFORT_UNLOCK.spanMs;

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
export async function isVibeUnlocked(
  sessionId: string,
  session?: AnonSession,
  viewerAnonId?: string
): Promise<boolean> {
  if (meetsVibeGate({ engagedMs: await getEngagedMs(sessionId) })) return true;
  if (!session || !viewerAnonId) return false;
  const partner = session.anon1 === viewerAnonId ? session.anon2 : session.anon1;
  return meetsEffortGate(await getEffort(sessionId, partner));
}
