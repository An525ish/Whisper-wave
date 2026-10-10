import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { v4 as uuid } from 'uuid';
import { getRedis } from '../../../config/redis.js';
import { deleteClaim, peekClaim, saveClaim, takeClaim } from '../claim.js';
import type { ConnectionClaim } from '../claim.js';
import { blockUsers, isBlocked } from '../block.js';
import { REDIS_KEYS } from '../keys.js';
import { card, skipUnlessRedis, useTestRedis } from './redisHarness.js';

/**
 * Integration tests for mutual-like claims and account-level blocks.
 *
 * Claims own `match:claim:*` keys (per-anonId, no shared state); blocks here
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
      assert.deepStrictEqual(await peekClaim(a), claimA);
      assert.deepStrictEqual(await peekClaim(b), claimB);
    } finally {
      await deleteClaim(a);
      await deleteClaim(b);
    }
  });

  it('takeClaim is single-use: the second redeemer gets null', async (t) => {
    skipUnlessRedis(t);
    const sessionId = uuid();
    const anonId = uuid();
    try {
      await saveClaim(anonId, claimFor(sessionId, 0));
      const first = await takeClaim(anonId);
      assert.equal(first?.sessionId, sessionId);
      assert.equal(await takeClaim(anonId), null);
      assert.equal(await peekClaim(anonId), null);
    } finally {
      await deleteClaim(anonId);
    }
  });

  it('missing claims read as null, never throw', async (t) => {
    skipUnlessRedis(t);
    const anonId = uuid();
    assert.equal(await peekClaim(anonId), null);
    assert.equal(await takeClaim(anonId), null);
    await deleteClaim(anonId); // also fine
  });

  it('rejects malformed claim payloads as absent', async (t) => {
    skipUnlessRedis(t);
    const anonId = uuid();
    try {
      await getRedis().set(REDIS_KEYS.claim(anonId), '{not json', 'EX', 60);
      assert.equal(await peekClaim(anonId), null);
      await getRedis().set(
        REDIS_KEYS.claim(anonId),
        JSON.stringify({ sessionId: uuid(), seat: 7 }),
        'EX',
        60
      );
      assert.equal(await peekClaim(anonId), null);
    } finally {
      await deleteClaim(anonId);
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
