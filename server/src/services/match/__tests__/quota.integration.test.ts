import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getRedis } from '../../../config/redis.js';
import { DAILY_WHISPER_LIMIT, consumeWhisperQuota, peekWhisperQuota } from '../quota.js';
import { REDIS_KEYS, TTL } from '../keys.js';
import { skipUnlessRedis, useTestRedis } from './redisHarness.js';

/**
 * The rolling whisper cap against real Redis.
 *
 * The boundary is the thing that matters: attempt N must be allowed and attempt
 * N+1 must be refused, per account, with a TTL so the window actually closes.
 */

useTestRedis();

const clearQuota = async (userId: string): Promise<void> => {
  await getRedis().del(REDIS_KEYS.userWhispers(userId));
};

describe('signed-in whisper quota (Redis integration)', () => {
  it('allows exactly the limit, then refuses', async (t) => {
    skipUnlessRedis(t);
    const user = 'quota-user';
    await clearQuota(user);

    // The boundary itself: attempt N is allowed, attempt N+1 is not.
    for (let i = 1; i <= DAILY_WHISPER_LIMIT; i++) {
      const quota = await consumeWhisperQuota(user);
      assert.equal(quota.used, i, `attempt ${i} should report its own count`);
    }

    await assert.rejects(
      () => consumeWhisperQuota(user),
      (err: Error & { statusCode?: number }) => {
        assert.equal(err.statusCode, 429, 'the cap must be a 429 the client can branch on');
        assert.match(err.message, /whispers/i);
        return true;
      }
    );

    await clearQuota(user);
  });

  it('keeps counting refused attempts, so retrying cannot escape the cap', async (t) => {
    skipUnlessRedis(t);
    const user = 'quota-retry';
    await clearQuota(user);
    for (let i = 0; i < DAILY_WHISPER_LIMIT + 5; i++) {
      await consumeWhisperQuota(user).catch(() => undefined);
    }
    const quota = await peekWhisperQuota(user);
    assert.equal(
      quota.used,
      DAILY_WHISPER_LIMIT + 5,
      'a refused attempt must still be counted, or "retry until under" bypasses the cap'
    );
    await clearQuota(user);
  });

  it('is per account — one user exhausting the cap does not affect another', async (t) => {
    skipUnlessRedis(t);
    const a = 'quota-iso-a';
    const b = 'quota-iso-b';
    await Promise.all([clearQuota(a), clearQuota(b)]);

    for (let i = 0; i < DAILY_WHISPER_LIMIT + 1; i++) {
      await consumeWhisperQuota(a).catch(() => undefined);
    }
    assert.equal((await consumeWhisperQuota(b)).used, 1, 'quota must not be shared');
    await Promise.all([clearQuota(a), clearQuota(b)]);
  });

  it('gives a signed-in user a generous limit', async (t) => {
    skipUnlessRedis(t);
    // A cap a casual user can hit is a product bug, not an abuse lever.
    assert.ok(DAILY_WHISPER_LIMIT >= 20, 'too tight to be invisible to a real user');
  });

  it('sets a TTL so the window actually closes', async (t) => {
    skipUnlessRedis(t);
    const user = 'quota-ttl';
    await clearQuota(user);
    await consumeWhisperQuota(user);

    // Without an expiry the counter is permanent and the account is locked out of
    // Whisper for good.
    const ttl = await getRedis().ttl(REDIS_KEYS.userWhispers(user));
    assert.ok(ttl > 0 && ttl <= TTL.whisperWindow, `expected a rolling window TTL, got ${ttl}`);
    await clearQuota(user);
  });
});
