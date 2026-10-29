import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { v4 as uuid } from 'uuid';
import { getRedis } from '../../../config/redis.js';
import { deleteClaim, listClaims, peekClaim, saveClaim, takeClaim } from '../claim.js';
import type { ConnectionClaim } from '../../../types/connection.js';
import { blockUsers, isBlocked } from '../block.js';
import { REDIS_KEYS } from '../keys.js';
import { card, skipUnlessRedis, useTestRedis } from './redisHarness.js';

/**
 * Integration tests for mutual-like claims and account-level blocks.
 *
 * Claims own `match:claim:*` / `match:claims:*` keys (per-anonId+session, no shared state); blocks here
 * use throwaway user ids. Each test cleans the exact keys it writes — never
 * the global queue, which `queue.integration.test.ts` owns.
 */

const claimFor = (sessionId: string, seat: 0 | 1): ConnectionClaim => ({
  sessionId,
  seat,
  originNames: ['night_fox', 'blue_static'],
  originTags: [['music'], ['gaming']],
  createdAt: Date.now(),
});

useTestRedis();

describe('mutual-like claims', () => {
  it('round-trips a claim per seat', async (t) => {
    skipUnlessRedis(t);
    const sessionId = uuid();
    const [a, b] = [uuid(), uuid()];
    const claimA = claimFor(sessionId, 0);
    const claimB = claimFor(sessionId, 1);
    try {
      await saveClaim(a, claimA);
      await saveClaim(b, claimB);
      assert.deepStrictEqual(await peekClaim(a, sessionId), claimA);
      assert.deepStrictEqual(await peekClaim(b, sessionId), claimB);
    } finally {
      await deleteClaim(a, sessionId);
      await deleteClaim(b, sessionId);
    }
  });

  it('keeps a second mutual like on the same browser alongside the first', async (t) => {
    skipUnlessRedis(t);
    const anonId = uuid();
    const [s1, s2] = [uuid(), uuid()];
    try {
      await saveClaim(anonId, claimFor(s1, 0));
      await saveClaim(anonId, claimFor(s2, 1));
      assert.equal((await peekClaim(anonId, s1))?.seat, 0);
      assert.equal((await peekClaim(anonId, s2))?.seat, 1);
      const listed = (await listClaims(anonId)).map((c) => c.sessionId).sort();
      assert.deepStrictEqual(listed, [s1, s2].sort());
      assert.ok((await getRedis().ttl(REDIS_KEYS.claimIndex(anonId))) > 0, 'index must expire');
    } finally {
      await deleteClaim(anonId, s1);
      await deleteClaim(anonId, s2);
    }
  });

  it('takeClaim is single-use: the second redeemer gets null', async (t) => {
    skipUnlessRedis(t);
    const sessionId = uuid();
    const anonId = uuid();
    try {
      await saveClaim(anonId, claimFor(sessionId, 0));
      const first = await takeClaim(anonId, sessionId);
      assert.equal(first?.sessionId, sessionId);
      assert.equal(await takeClaim(anonId, sessionId), null);
      assert.equal(await peekClaim(anonId, sessionId), null);
      assert.deepStrictEqual(await listClaims(anonId), []);
    } finally {
      await deleteClaim(anonId, sessionId);
    }
  });

  it('listClaims prunes index members whose claim key expired', async (t) => {
    skipUnlessRedis(t);
    const anonId = uuid();
    const [live, gone] = [uuid(), uuid()];
    try {
      await saveClaim(anonId, claimFor(live, 0));
      await saveClaim(anonId, claimFor(gone, 1));
      await getRedis().del(REDIS_KEYS.claim(anonId, gone)); // as if TTL elapsed
      assert.deepStrictEqual((await listClaims(anonId)).map((c) => c.sessionId), [live]);
      assert.deepStrictEqual(await getRedis().smembers(REDIS_KEYS.claimIndex(anonId)), [live]);
    } finally {
      await deleteClaim(anonId, live);
    }
  });

  it('missing claims read as null/empty, never throw', async (t) => {
    skipUnlessRedis(t);
    const anonId = uuid();
    const sessionId = uuid();
    assert.equal(await peekClaim(anonId, sessionId), null);
    assert.equal(await takeClaim(anonId, sessionId), null);
    assert.deepStrictEqual(await listClaims(anonId), []);
    await deleteClaim(anonId, sessionId); // also fine
  });

  it('rejects malformed claim payloads as absent', async (t) => {
    skipUnlessRedis(t);
    const anonId = uuid();
    const sessionId = uuid();
    try {
      await getRedis().set(REDIS_KEYS.claim(anonId, sessionId), '{not json', 'EX', 60);
      assert.equal(await peekClaim(anonId, sessionId), null);
      await getRedis().set(
        REDIS_KEYS.claim(anonId, sessionId),
        JSON.stringify({ sessionId, seat: 7 }),
        'EX',
        60
      );
      assert.equal(await peekClaim(anonId, sessionId), null);
    } finally {
      await deleteClaim(anonId, sessionId);
    }
  });
});

describe('account-level blocks', () => {
  it('blockUsers keeps two accounts from matching under either identity', async (t) => {
    skipUnlessRedis(t);
    const [userA, userB] = [uuid(), uuid()];
    try {
      await blockUsers(userA, userB);
      assert.equal(
        await isBlocked({ anonId: uuid(), userId: userA }, { anonId: uuid(), userId: userB }),
        true
      );
      // And the reverse direction too.
      assert.equal(
        await isBlocked({ anonId: uuid(), userId: userB }, { anonId: uuid(), userId: userA }),
        true
      );
    } finally {
      await getRedis().del(REDIS_KEYS.blocked(userA), REDIS_KEYS.blocked(userB));
    }
  });

  it('does not block strangers', async (t) => {
    skipUnlessRedis(t);
    assert.equal(
      await isBlocked({ anonId: card(uuid()).anonId }, { anonId: card(uuid()).anonId }),
      false
    );
  });
});
