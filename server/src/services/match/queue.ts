import { v4 as uuid } from 'uuid';
import { getRedis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import type { MatchCandidate, VibeTag, WaitingCard } from '../../types/match.js';
import { REDIS_KEYS, TTL } from './keys.js';
import { isBlockedEitherWay } from './block.js';

/**
 * Persist an anon user's identity card (display name, vibes, gender).
 *
 * This is identity, NOT queue membership — the queue is the `match:queue` list.
 * Keeping them separate is what lets a reconnecting user rejoin with the same
 * alias after their match ended, instead of being stranded with no identity.
 */
export const saveWaitingCard = async (card: WaitingCard): Promise<void> => {
  await getRedis().set(
    REDIS_KEYS.waiting(card.anonId),
    JSON.stringify(card),
    'EX',
    TTL.waiting
  );
};

/** Read back an identity card (null = never set or fully expired). */
export const getWaitingCard = async (anonId: string): Promise<WaitingCard | null> => {
  const raw = await getRedis().get(REDIS_KEYS.waiting(anonId));
  if (!raw) return null;
  return JSON.parse(raw) as WaitingCard;
};

/**
 * Keep the identity card alive without touching `joinedAt`.
 * Called on every message so an active session never ages out.
 */
export const touchWaitingCard = async (anonId: string): Promise<void> => {
  try {
    await getRedis().expire(REDIS_KEYS.waiting(anonId), TTL.waiting);
  } catch (err) {
    // Non-fatal: the card still works, it just stops being refreshed.
    logger.warn({ err, anonId }, 'Failed to refresh identity card TTL');
  }
};

/** Forget an identity card entirely — only on an explicit queue exit. */
export const deleteWaitingCard = async (anonId: string): Promise<void> => {
  await getRedis().del(REDIS_KEYS.waiting(anonId));
};

/** Push self onto the global queue. */
export const enqueue = async (anonId: string): Promise<void> => {
  await getRedis().lpush(REDIS_KEYS.queue, anonId);
};

/** Idempotent: remove then add so reconnect/connect handlers don't duplicate entries. */
export const reenqueue = async (anonId: string): Promise<void> => {
  await dequeue(anonId);
  await enqueue(anonId);
};

/**
 * Count shared vibe tags between two users.
 *
 * Exported (and pure) so the scoring rule can be unit tested without Redis —
 * it's the one piece of matching logic that decides who talks to whom.
 */
export const vibePairScore = (a: VibeTag[], b: VibeTag[]): number => {
  if (!a?.length || !b?.length) return 0;
  const set = new Set(a.map((t) => t.toLowerCase()));
  let n = 0;
  for (const t of new Set(b.map((x) => x.toLowerCase()))) if (set.has(t)) n += 1;
  return n;
};

/**
 * Claim the first candidate we can atomically remove from the queue.
 *
 * The claim is a single Lua script: LREM the candidate and, if the removal
 * actually happened, we own them. This is what makes concurrent matching safe
 * without a global mutex — two matchers can scan the same candidates in
 * parallel and exactly one of them wins each one.
 *
 * `candidates` must already be ordered best-first. Returns the claimed anonId,
 * or null when every candidate was taken by someone else in the meantime.
 */
const CLAIM_SCRIPT = `
  for i = 1, #ARGV do
    if redis.call('LREM', KEYS[1], 0, ARGV[i]) > 0 then
      return ARGV[i]
    end
  end
  return false
`;

const claimCandidate = async (candidates: string[]): Promise<string | null> => {
  if (candidates.length === 0) return null;
  const claimed = (await getRedis().eval(
    CLAIM_SCRIPT,
    1,
    REDIS_KEYS.queue,
    ...candidates
  )) as string | null;
  return claimed ?? null;
};

/**
 * Vibe-aware, block-aware match attempt.
 *
 * Reads the queue non-destructively, drops ourselves and anyone we're blocked
 * with (in either direction), scores the rest by shared vibe tags, and prefers
 * the best overlap — tie-broken by longest wait.
 *
 * No global lock: candidates are claimed atomically inside `claimCandidate`, so
 * the previous process-wide mutex (a single key held across an O(n) scan) is
 * gone. This was the throughput ceiling on matching.
 *
 * Returns the matched partner's anonId, or null if nobody suitable is waiting.
 */
export const tryMatchFromQueue = async (self: WaitingCard): Promise<string | null> => {
  const redis = getRedis();

  // Snapshot the queue (index 0 = most recent). Skip self.
  const queued = (await redis.lrange(REDIS_KEYS.queue, 0, -1)).filter(
    (id) => id !== self.anonId
  );
  if (queued.length === 0) return null;

  // Later index = joined earlier = higher fairness priority.
  const waitRank = new Map<string, number>();
  queued.forEach((id, i) => {
    if (!waitRank.has(id)) waitRank.set(id, i);
  });
  const candidates = [...waitRank.keys()];

  // Load candidate cards in one round-trip.
  const cardPipe = redis.pipeline();
  candidates.forEach((id) => cardPipe.get(REDIS_KEYS.waiting(id)));
  const cardResults = await cardPipe.exec();

  const blockedChecks = await Promise.all(
    candidates.map((anonId) => isBlockedEitherWay(self.anonId, anonId))
  );

  const eligible: MatchCandidate[] = [];
  candidates.forEach((anonId, i) => {
    const raw = cardResults?.[i]?.[1] as string | null | undefined;
    if (!raw) return; // no identity card — stale queue entry, skip
    if (blockedChecks[i]) return;

    const card = JSON.parse(raw) as WaitingCard;
    eligible.push({
      anonId,
      score: vibePairScore(self.vibeTags, card.vibeTags),
      rank: waitRank.get(anonId) ?? i,
    });
  });

  // Best vibe overlap first; tie-break by longest wait.
  eligible.sort((a, b) => b.score - a.score || b.rank - a.rank);

  return claimCandidate(eligible.map((c) => c.anonId));
};

/** Remove an anonId from the queue if present (called on disconnect/skip). */
export const dequeue = async (anonId: string): Promise<void> => {
  try {
    // LREM with count 0 removes all occurrences.
    await getRedis().lrem(REDIS_KEYS.queue, 0, anonId);
  } catch (err) {
    // Non-critical — log and continue so a Redis blip doesn't strand the user.
    logger.warn({ err, anonId }, 'Failed to dequeue anonId');
  }
};

/** Rough size of the global queue, for "X people in the void" copy. */
export const queueSize = async (): Promise<number> =>
  getRedis().llen(REDIS_KEYS.queue);

/** Generate a fresh anonymous session ID. */
export const generateSessionId = (): string => uuid();
