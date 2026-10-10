import { v4 as uuid } from 'uuid';
import { getRedis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import type {
  MatchAttempt,
  MatchCandidate,
  MatchIdentity,
  VibeTag,
  WaitingCard,
} from '../../types/match.js';
import { REDIS_KEYS, TTL } from './keys.js';
import { findBlockedCandidates } from './block.js';

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
 * Attach (or clear) the signed-in account on an existing identity card, and hand
 * the (possibly updated) card back so the caller does not read it a second time.
 *
 * Called on every /anon connect, where the account is known. A signed-out socket
 * CLEARS the link rather than leaving it: the anonId cookie is a 24 h
 * credential, and a stale account on it would charge the next person to use that
 * device this stranger's quota and blocks.
 *
 * Returns null when there is no identity card yet.
 */
export const setWaitingCardUser = async (
  anonId: string,
  userId: string | undefined
): Promise<WaitingCard | null> => {
  const card = await getWaitingCard(anonId);
  if (!card) return null; // no identity card yet — nothing to attach the account to
  if (card.userId === userId) return card; // already correct; don't rewrite the TTL

  const next: WaitingCard = { ...card };
  if (userId) next.userId = userId;
  else delete next.userId;
  await saveWaitingCard(next);
  return next;
};

/** Forget an identity card entirely — only on an explicit queue exit. */
export const deleteWaitingCard = async (anonId: string): Promise<void> => {
  await getRedis().del(REDIS_KEYS.waiting(anonId));
};

/**
 * Persist `anonId → userId` so a block on this anonId can reach the account.
 *
 * The link is what makes a block survive the blocked person signing in: without
 * it there is no way to attach an anonId-scoped block to an account.
 */
export const setIdentityAlias = async (
  anonId: string,
  userId: string | undefined
): Promise<void> => {
  const key = REDIS_KEYS.identityAlias(anonId);
  if (!userId) {
    await getRedis().del(key);
    return;
  }
  await getRedis().set(key, userId, 'EX', TTL.identityAlias);
};

/**
 * Atomic "remove then push", so a reconnect/refresh never duplicates an entry and
 * never leaves a window where the user is in the queue twice (or not at all).
 *
 * With the guard on (`ARGV[2] == '1'`) it refuses when the anonId already holds an
 * active match — a second tab connecting at the wrong moment must not put a
 * matched user back into the queue.
 */
const ENQUEUE_SCRIPT = `
  if ARGV[2] == '1' and redis.call('EXISTS', KEYS[2]) == 1 then
    return 0
  end
  redis.call('LREM', KEYS[1], 0, ARGV[1])
  redis.call('LPUSH', KEYS[1], ARGV[1])
  return 1
`;

const runEnqueue = async (anonId: string, guardActive: boolean): Promise<boolean> =>
  Number(
    await getRedis().eval(
      ENQUEUE_SCRIPT,
      2,
      REDIS_KEYS.queue,
      REDIS_KEYS.activeSession(anonId),
      anonId,
      guardActive ? '1' : '0'
    )
  ) === 1;

/**
 * Put self on the global queue (idempotent). Returns false — and does nothing —
 * when the anonId is already in an active match.
 */
export const enqueue = async (anonId: string): Promise<boolean> => runEnqueue(anonId, true);

/**
 * Idempotent put-back WITHOUT the active-match guard. Only for rollbacks, where a
 * half-built session may have left an active pointer behind that is being torn
 * down at the same moment.
 */
export const reenqueue = async (anonId: string): Promise<void> => {
  await runEnqueue(anonId, false);
};

/**
 * Drop the whole queue. Called once at boot: every socket died with the previous
 * process, so every entry is a ghost that would be claimed and paired with
 * nobody. Clients re-enter via `ANON_REQUEUE`/reconnect, which re-enqueues them.
 * SINGLE-PROCESS ASSUMPTION — with several instances this would wipe live users
 * and must become a per-instance heartbeat check instead.
 */
export const purgeQueue = async (): Promise<void> => {
  await getRedis().del(REDIS_KEYS.queue);
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
 * How many of the longest-waiting queue entries a single join attempt considers.
 *
 * The queue is one FIFO list pushed with LPUSH, so index 0 is the newest arrival
 * and the tail is the longest wait. This reads the tail — the people who have
 * been waiting longest — which is what a waiting room promises: the further you
 * have waited, the more certain you are of being considered.
 *
 * It used to read `0 -1`, i.e. the entire list. That made every join attempt
 * O(queue length): a full-list response, one identity-card GET per entry, and
 * two block checks per entry. At 10k waiting that is ~30k Redis operations per
 * join, and joins happen on every match, every skip and every reconnect.
 *
 * Bounding costs vibe-priority *reach* — a 3-tag match far down the list is no
 * longer seen — but not correctness. Nobody starves: every join is a seek, so a
 * newcomer matches on its own first attempt if anyone at all is waiting, and
 * anyone who is being waited *on* sits in this window because it is anchored to
 * the oldest entries.
 */
const CANDIDATE_SCAN_WINDOW = 200;

/**
 * Claim the first candidate we can atomically remove from the queue.
 *
 * One Lua script, no interleaving point, so concurrent matchers are safe without
 * a global mutex:
 *
 *   1. Self must still be queued (`LPOS`). If it is not, someone else already
 *      claimed US as their partner — abort (`-1`). Without this, two joiners who
 *      are both in the queue and scan simultaneously each claim the other and
 *      both get two partners.
 *   2. Claim the first available candidate with `LREM`; on success also remove
 *      self, so after a successful pair NEITHER anonId remains in the queue.
 *   3. If nothing could be claimed, self stays queued at its original position
 *      (`0`) — that is why this is `LPOS` rather than `LREM self` + re-push.
 *
 * `candidates` must already be ordered best-first.
 */
const CLAIM_SCRIPT = `
  if not redis.call('LPOS', KEYS[1], ARGV[1]) then
    return -1
  end
  for i = 2, #ARGV do
    if redis.call('LREM', KEYS[1], 0, ARGV[i]) > 0 then
      redis.call('LREM', KEYS[1], 0, ARGV[1])
      return ARGV[i]
    end
  end
  return 0
`;

const claimCandidate = async (
  selfAnonId: string,
  candidates: string[]
): Promise<MatchAttempt> => {
  if (candidates.length === 0) return { outcome: 'none' };
  const result = await getRedis().eval(
    CLAIM_SCRIPT,
    1,
    REDIS_KEYS.queue,
    selfAnonId,
    ...candidates
  );
  if (typeof result === 'string') return { outcome: 'matched', partnerAnonId: result };
  return result === -1 ? { outcome: 'self_claimed' } : { outcome: 'none' };
};

/**
 * Vibe-aware, block-aware match attempt. `self` MUST already be in the queue
 * (see `enqueue`) — that is what lets a concurrent matcher find them.
 *
 * Reads a bounded window of the queue non-destructively, drops ourselves and
 * anyone we're blocked with (in either direction), scores the rest by shared
 * vibe tags, and prefers the best overlap — tie-broken by longest wait.
 *
 * No global lock: candidates are claimed atomically inside `claimCandidate`, so
 * the previous process-wide mutex (a single key held across an O(n) scan) is
 * gone.
 *
 * Cost per attempt is bounded by `CANDIDATE_SCAN_WINDOW` regardless of how many
 * people are waiting, in three round-trips: the window read, the identity-card
 * pipeline, the block pipeline. (The per-account whisper cap is NOT here — it runs
 * once per queue entry, in the /anon connect handler, so the scan's cost stays a
 * function of the window alone.)
 *
 * `self_claimed` means another matcher paired us first; the caller must do
 * nothing, because the claimer emits `MATCH_FOUND` to our room.
 */
export const tryMatchFromQueue = async (
  self: WaitingCard,
  /** Account ids this user already keeps — never rematch them anonymously. */
  connectedUserIds: ReadonlySet<string> = new Set()
): Promise<MatchAttempt> => {
  const redis = getRedis();

  // Tail-anchored window = the longest-waiting entries.
  const tail = await redis.lrange(REDIS_KEYS.queue, -CANDIDATE_SCAN_WINDOW, -1);

  // A window shorter than the cap is the WHOLE queue, so self's absence from it
  // means we were already claimed — answered for free, without running the script.
  if (!tail.includes(self.anonId) && tail.length < CANDIDATE_SCAN_WINDOW) {
    return { outcome: 'self_claimed' };
  }

  const queued = tail.filter((id) => id !== self.anonId);
  if (queued.length === 0) return { outcome: 'none' };

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

  // A queue entry with no card is stale (card expired, or the enqueue failed) —
  // it is not a person, so it must not be matched on or block-checked.
  const identities: MatchIdentity[] = [];
  const cards: (WaitingCard | null)[] = [];
  candidates.forEach((anonId, i) => {
    const raw = cardResults?.[i]?.[1] as string | null | undefined;
    if (!raw) {
      cards.push(null);
      return;
    }
    const card = JSON.parse(raw) as WaitingCard;
    cards.push(card);
    identities.push({ anonId, userId: card.userId });
  });

  // Block checks batched into ONE round-trip — at most four SISMEMBERs per
  // candidate, but always together. This is the check that used to make matching
  // O(queue length), so "how many round-trips" matters far more here than "how
  // many commands": the window bounds the commands, the pipeline bounds the
  // round-trips.
  const blocked = await findBlockedCandidates(
    { anonId: self.anonId, userId: self.userId },
    identities
  );

  const eligible: MatchCandidate[] = [];
  candidates.forEach((anonId, i) => {
    const card = cards[i];
    if (!card) return; // stale queue entry
    if (blocked.has(anonId)) return;
    // Already connected accounts never rematch anonymously — the DM is reused
    // on Connect instead. Free: the card is already in hand.
    if (card.userId && connectedUserIds.has(card.userId)) return;
    // Never match an account with itself. A signed-in user on a phone and a
    // laptop is two anonIds and one account, and the anonId filter above cannot
    // see that — so without this the same person is handed their own other tab,
    // and talks to themselves. Free: the card is already in hand.
    if (self.userId && card.userId === self.userId) return;
    eligible.push({
      anonId,
      score: vibePairScore(self.vibeTags, card.vibeTags),
      rank: waitRank.get(anonId) ?? i,
    });
  });

  // Best vibe overlap first; tie-break by longest wait.
  eligible.sort((a, b) => b.score - a.score || b.rank - a.rank);

  return claimCandidate(
    self.anonId,
    eligible.map((c) => c.anonId)
  );
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
