import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getRedis } from '../../config/redis.js';
import { skipUnlessRedis, useTestRedis } from '../../services/match/__tests__/redisHarness.js';
import {
  makeRedisSocketRateLimiter,
  makeSocketRateLimiter,
  socketLimiterKey,
} from '../rateLimiter.js';

/**
 * The Redis socket rate limiter, against real Redis.
 *
 * The harness is the one the match integration suites use, not a second copy:
 * it owns the `REDIS_KEY_PREFIX` guard that keeps an integration run from wiping
 * a developer's live queue, and a copy that quietly forgot that guard would be
 * worse than no guard at all. So no `socket/__tests__/redisHarness.ts` exists.
 *
 * What is worth asserting here, and not in a unit test, is everything that only
 * shows up once the window is real: that entries age out one at a time, that a
 * saturated socket cannot take a second allowance across the window edge, and
 * that a concurrent burst admits exactly the cap. The last one is the reason the
 * window is a Lua script at all — three round trips would let every event in a
 * burst read the same count below the cap.
 *
 * Namespaces are prefixed `rl-` so a key left behind by a killed run is obvious
 * in `redis-cli`, and this file cleans up only the keys it wrote.
 */

const written: string[] = [];

/** Register a key this file owns and return the socket id to hand the limiter. */
const track = (namespace: string, socketId: string): string => {
  written.push(socketLimiterKey(namespace, socketId));
  return socketId;
};

const clear = async (namespace: string, socketId: string): Promise<void> => {
  await getRedis().del(socketLimiterKey(namespace, socketId));
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms).unref();
  });

useTestRedis(async () => {
  if (written.length === 0) return;
  await getRedis().del(...new Set(written));
  written.length = 0;
});

describe('Redis socket rate limiter', () => {
  it('admits exactly maxEvents, then refuses', async (t) => {
    skipUnlessRedis(t);
    const namespace = 'admit';
    const id = track(namespace, 'rl-admit');
    await clear(namespace, id);

    const limiter = makeRedisSocketRateLimiter(namespace, 3, 60_000);
    for (let i = 1; i <= 3; i++) {
      assert.equal(await limiter.allow(id), true, `event ${i} of 3 must be admitted`);
    }
    assert.equal(await limiter.allow(id), false, 'the fourth event is over budget');
    assert.equal(
      await limiter.allow(id),
      false,
      'staying over budget must keep being refused, not drift back under it'
    );
  });

  it('counts per socket, so one socket cannot spend another socket’s budget', async (t) => {
    skipUnlessRedis(t);
    const namespace = 'per-socket';
    const noisy = track(namespace, 'rl-noisy');
    const quiet = track(namespace, 'rl-quiet');
    await Promise.all([clear(namespace, noisy), clear(namespace, quiet)]);

    const limiter = makeRedisSocketRateLimiter(namespace, 2, 60_000);
    assert.equal(await limiter.allow(noisy), true);
    assert.equal(await limiter.allow(noisy), true);
    assert.equal(await limiter.allow(noisy), false);
    assert.equal(await limiter.allow(quiet), true, 'a second socket has its own window');
  });

  it('gives each namespace its own bucket', async (t) => {
    skipUnlessRedis(t);
    const socketId = 'rl-shared';
    track('ns-msg', socketId);
    track('ns-like', socketId);
    await Promise.all([clear('ns-msg', socketId), clear('ns-like', socketId)]);

    // Same socket, two limiters. A shared bucket would let the message allowance
    // launder the reaction allowance, so both must be independently spendable.
    const msgLimiter = makeRedisSocketRateLimiter('ns-msg', 2, 60_000);
    const likeLimiter = makeRedisSocketRateLimiter('ns-like', 2, 60_000);

    assert.equal(await msgLimiter.allow(socketId), true);
    assert.equal(await msgLimiter.allow(socketId), true);
    assert.equal(await msgLimiter.allow(socketId), false, 'messages are over budget');
    assert.equal(
      await likeLimiter.allow(socketId),
      true,
      'likes must not be charged for the messages'
    );
    assert.equal(await likeLimiter.allow(socketId), true);
    assert.equal(await likeLimiter.allow(socketId), false, 'likes have their own budget too');
  });

  it('slides the window — the oldest entries age out and capacity returns', async (t) => {
    skipUnlessRedis(t);
    const namespace = 'slide';
    const id = track(namespace, 'rl-slide');
    await clear(namespace, id);

    const windowMs = 250;
    const limiter = makeRedisSocketRateLimiter(namespace, 3, windowMs);

    for (let i = 0; i < 3; i++) {
      assert.equal(await limiter.allow(id), true, `event ${i + 1} of 3 must be admitted`);
    }

    // Halfway through the window nothing has aged out, so the cap still holds.
    await sleep(100);
    assert.equal(
      await limiter.allow(id),
      false,
      'a sliding window must not hand back capacity before the entries expire'
    );

    // Past the window edge every entry is gone and the full allowance is back.
    await sleep(250);
    for (let i = 0; i < 3; i++) {
      assert.equal(await limiter.allow(id), true, `recovered slot ${i + 1} of 3`);
    }
    assert.equal(await limiter.allow(id), false, 'and the window is full again');
  });

  it('does not hand out a second allowance across the window edge', async (t) => {
    skipUnlessRedis(t);
    const namespace = 'edge';
    const id = track(namespace, 'rl-edge');
    await clear(namespace, id);

    const windowMs = 600;
    const limiter = makeRedisSocketRateLimiter(namespace, 3, windowMs);

    // Saturate over most of one window rather than in a single instant, so the
    // entries carry distinct ages — that is what a fixed window cannot model.
    assert.equal(await limiter.allow(id), true, 't=0');
    await sleep(200);
    assert.equal(await limiter.allow(id), true, 't=200');
    const secondEntryAt = Date.now();
    await sleep(200);
    assert.equal(await limiter.allow(id), true, 't=400');

    await sleep(100);
    assert.equal(await limiter.allow(id), false, 't=500 — the window has not elapsed');

    // Past the first entry's expiry but not the other two's: exactly one slot
    // comes back. A fixed window that reset at the edge would return all three.
    await sleep(200);
    assert.equal(await limiter.allow(id), true, 't=700 — exactly one slot came back');

    await sleep(10);
    // Timers drift when suites run in parallel. If the t=200 entry has already
    // aged out in real time, the premise is gone and asserting would only test
    // the scheduler — so judge by the clock, not by the intended sleeps.
    if (Date.now() - secondEntryAt >= windowMs) return;
    assert.equal(
      await limiter.allow(id),
      false,
      't=710 — the other two entries still hold it, so a burst across the edge cannot double the rate'
    );
  });

  it('admits exactly maxEvents when a burst arrives at once', async (t) => {
    skipUnlessRedis(t);
    const namespace = 'burst';
    const id = track(namespace, 'rl-burst');
    await clear(namespace, id);

    const limiter = makeRedisSocketRateLimiter(namespace, 5, 60_000);
    // All of these land in the same millisecond, which is the case three
    // separate round trips get wrong: every one of them reads a count below the
    // cap and every one of them is admitted.
    const verdicts = await Promise.all(
      Array.from({ length: 30 }, () => limiter.allow(id))
    );
    assert.equal(
      verdicts.filter(Boolean).length,
      5,
      'a concurrent burst must admit exactly the cap, however many raced'
    );
  });

  it('clears state on remove(), so the same socket id starts clean', async (t) => {
    skipUnlessRedis(t);
    const namespace = 'clear';
    const id = track(namespace, 'rl-clear');
    await clear(namespace, id);

    const limiter = makeRedisSocketRateLimiter(namespace, 2, 60_000);
    assert.equal(await limiter.allow(id), true);
    assert.equal(await limiter.allow(id), true);
    assert.equal(await limiter.allow(id), false, 'over budget first');

    await limiter.remove(id);

    assert.equal(await limiter.allow(id), true, 'remove() must give back the whole window');
    assert.equal(await limiter.allow(id), true);
    assert.equal(await limiter.allow(id), false, 'and only one window, not an unlimited one');
  });

  it('arms a TTL on the key, and remove() leaves nothing behind', async (t) => {
    skipUnlessRedis(t);
    const namespace = 'ttl';
    const id = track(namespace, 'rl-ttl');
    await clear(namespace, id);

    const windowMs = 2_000;
    const limiter = makeRedisSocketRateLimiter(namespace, 3, windowMs);
    await limiter.allow(id);

    // Read through the raw client: a TTL on the limiter's own state is exactly
    // the thing a re-read through the limiter would hide.
    const key = socketLimiterKey(namespace, id);
    const ttl = await getRedis().pttl(key);
    assert.ok(ttl > 0, `expected a live expiry on ${key}, got ${ttl}ms`);
    assert.ok(ttl <= windowMs, `the expiry must not outlive the window, got ${ttl}ms`);
    assert.equal(await getRedis().zcard(key), 1, 'the admitted event is the one member');

    await limiter.remove(id);
    assert.equal(
      await getRedis().exists(key),
      0,
      'remove() must delete the key outright — an emptied set would still hold a window'
    );
  });
});

describe('in-process socket rate limiter', () => {
  it('answers as a promise, which is what the signed-in chat handlers rely on', async () => {
    // `/socket/handlers/*` pass `before: () => limiter.allow(socket.id)` and are
    // untouched by the Redis move. This is the contract that keeps them
    // compiling: a promise, never a bare boolean.
    const limiter = makeSocketRateLimiter(2, 10_000);

    const first = limiter.allow('authed-socket');
    assert.ok(first instanceof Promise, 'allow() must return a Promise<boolean>');
    assert.equal(await first, true);
    assert.equal(await limiter.allow('authed-socket'), true);
    assert.equal(await limiter.allow('authed-socket'), false, 'over budget');

    await limiter.remove('authed-socket');
    assert.equal(await limiter.allow('authed-socket'), true, 'remove() clears the window');
  });

  it('lets one socket through without touching another', async () => {
    const limiter = makeSocketRateLimiter(1, 10_000);
    assert.equal(await limiter.allow('authed-a'), true);
    assert.equal(await limiter.allow('authed-a'), false);
    assert.equal(await limiter.allow('authed-b'), true, 'windows are per socket');
  });
});