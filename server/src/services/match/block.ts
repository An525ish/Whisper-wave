import { getRedis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import type { MatchIdentity } from '../../types/match.js';
import { REDIS_KEYS, TTL } from './keys.js';

/**
 * Blocking, for both anonymous and signed-in identities.
 *
 * A block list is a SET at `match:blocked:<identity>` whose members are the
 * OTHER party's identities — every one of them that is known. So the check at
 * match time is simply: does any of my identities hold any of yours?
 *
 * Why both identities matter
 * -------------------------
 * Blocking used to be `anonId`-only, which made signing in a way to shed a
 * block. Concretely: someone is matched, reported and blocked as anonId `X`. They
 * clear their cookies, get a fresh `X'`, sign in, and are matched again. The
 * report is still on file and the block is still "in force" — it just isn't
 * attached to anything they present now.
 *
 * Mirroring every known identity on both sides closes that for the case that
 * matters: if either party was signed in when the block was raised, the account
 * id is recorded too, and a fresh anonId cannot walk around it. If NEITHER side
 * was signed in there is no account id in existence yet and nothing could
 * possibly be attached to it — that limit is inherent to never persisting anon
 * data, and it is the reason the read path below is written against identities
 * rather than anonIds.
 */

/** Every identifier that can stand in for a party. Never empty — anonId is. */
const identityKeys = (identity: MatchIdentity): string[] =>
  identity.userId ? [identity.anonId, identity.userId] : [identity.anonId];

/**
 * Resolve the signed-in account behind each of several anonIds.
 *
 * One round-trip regardless of how many are asked for. Returns `undefined` in
 * each slot for a party with no account, or for one we could not prove the link
 * for — and an unproven link is treated as "no account", which only ever means
 * a block is recorded on fewer keys, never on a wrong one.
 */
const resolveUserIds = async (anonIds: string[]): Promise<(string | undefined)[]> => {
  if (anonIds.length === 0) return [];
  const pipe = getRedis().pipeline();
  for (const anonId of anonIds) pipe.get(REDIS_KEYS.identityAlias(anonId));
  const results = await pipe.exec();
  return anonIds.map((anonId, i) => {
    const entry = results?.[i];
    if (!entry) return undefined;
    if (entry[0]) {
      logger.warn({ err: entry[0], anonId }, 'Failed to resolve anonId → userId alias');
      return undefined;
    }
    const value = entry[1];
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  });
};

/** Record the block in both directions, on every identity each side has. */
const writeBlock = async (blocker: MatchIdentity, target: MatchIdentity): Promise<void> => {
  const pipe = getRedis().pipeline();
  for (const [from, to] of [
    [blocker, target],
    [target, blocker],
  ] as const) {
    const members = identityKeys(to);
    for (const key of identityKeys(from)) {
      pipe.sadd(REDIS_KEYS.blocked(key), ...members);
      pipe.expire(REDIS_KEYS.blocked(key), TTL.blocked);
    }
  }
  await pipe.exec();
};

/**
 * Block `target` from being matched with `blocker`, in both directions.
 *
 * The signature is unchanged from the anonId-only version it grew out of,
 * because three call sites outside this service (report, admin report, auto
 * report) only ever know anonIds. The signed-in accounts are resolved from
 * `match:alias:*` inside, so a caller cannot forget to pass them and a block
 * raised by any of those paths is dual-key for free.
 */
export const blockAnonId = async (blocker: string, target: string): Promise<void> => {
  const [blockerUserId, targetUserId] = await resolveUserIds([blocker, target]);

  await writeBlock(
    { anonId: blocker, userId: blockerUserId },
    { anonId: target, userId: targetUserId }
  );
};

/** Check whether `blocker` has blocked `target`, under either identity. */
export const isBlocked = async (
  blocker: MatchIdentity,
  target: MatchIdentity
): Promise<boolean> => {
  const blocked = await findBlockedCandidates(blocker, [target]);
  return blocked.has(target.anonId);
};

/**
 * Which of `candidates` must not be matched with `self`, checking the block
 * relationship in both directions and across both identities.
 *
 * One `SISMEMBER` per (my identity × their identity) pair — at most four, and
 * only for the pairs where both sides actually have an account — all in a single
 * pipeline, so N candidates still cost ONE round-trip. This is on the join hot
 * path: it is the check that used to make matching O(queue length), and it must
 * stay O(window) with a fixed number of round-trips, not one per candidate.
 *
 * Because the block lists are written in both directions, the cross product
 * below is symmetric — there is no need to also ask "do THEY hold ME?".
 */
export const findBlockedCandidates = async (
  self: MatchIdentity,
  candidates: MatchIdentity[]
): Promise<Set<string>> => {
  const blocked = new Set<string>();
  if (candidates.length === 0) return blocked;

  const selfIdentities = identityKeys(self);

  // Fixed order per candidate — all of self's identities × all of theirs — so
  // results zip back by index.
  const pipe = getRedis().pipeline();
  for (const candidate of candidates) {
    for (const mine of selfIdentities) {
      for (const theirs of identityKeys(candidate)) {
        pipe.sismember(REDIS_KEYS.blocked(mine), theirs);
      }
    }
  }
  const results = await pipe.exec();

  let cursor = 0;
  for (const candidate of candidates) {
    const checks = selfIdentities.length * identityKeys(candidate).length;
    const rows = results?.slice(cursor, cursor + checks) ?? [];
    cursor += checks;

    if (rows.some((row) => row?.[0])) {
      // A command-level error means we cannot prove this pair is clean.
      // Drop the candidate rather than risk matching a blocked pair — a lost
      // match is recoverable, an ignored block is not.
      logger.warn(
        { anonId: self.anonId, candidate: candidate.anonId },
        'Block check failed — excluding candidate from this attempt'
      );
      blocked.add(candidate.anonId);
      continue;
    }

    if (rows.some((row) => row?.[1] === 1)) blocked.add(candidate.anonId);
  }

  return blocked;
};
