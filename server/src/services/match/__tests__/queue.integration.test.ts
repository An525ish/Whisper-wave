import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { getRedis, connectRedis, disconnectRedis } from '../../../config/redis.js';
import { env } from '../../../config/env.js';
import {
  enqueue,
  dequeue,
  reenqueue,
  saveWaitingCard,
  getWaitingCard,
  tryMatchFromQueue,
  queueSize,
} from '../queue.js';
import { createSession, getSession, endSession, bufferMessage, getBufferedMessages, isParticipant } from '../session.js';
import { blockAnonId } from '../block.js';
import { REDIS_KEYS } from '../keys.js';

/**
 * Integration tests for the Redis matching core.
 *
 * These exercise the property that unit tests can't: that concurrent matchers
 * can never claim the same candidate. The previous implementation relied on a
 * process-wide mutex for this; the current one relies on an atomic LREM inside a
 * Lua script, and `Promise.all` of N simultaneous matchers is the only way to
 * prove it.
 *
 * SAFETY: the suite refuses to run unless `REDIS_KEY_PREFIX` is set, and the
 * test env default is `test:`. The integration tests `del` the queue key, so
 * running them against an unprefixed Redis would wipe a developer's live queue
 * and every queued user's 24 h identity card. If Redis isn't reachable the whole
 * suite skips instead.
 */

let redisUp = false;

const card = (anonId: string, tags: string[] = []) => ({
  anonId,
  displayName: `alias-${anonId}`,
  vibeTags: tags,
  gender: 'prefer_not_to_say' as const,
  joinedAt: Date.now(),
});

before(async () => {
  if (!env.REDIS_KEY_PREFIX) {
    console.warn('[test] REDIS_KEY_PREFIX is empty — refusing to run destructive integration tests');
    return;
  }
  try {
    // Short timeout — a missing Redis must skip the suite, not hang the run.
    await connectRedis(3000);
    redisUp = true;
  } catch (err) {
    redisUp = false;
    console.warn(
      `[test] Redis unavailable (${err instanceof Error ? err.message : 'unknown'}) — skipping integration tests`
    );
  }
});

after(async () => {
  if (redisUp) {
    await getRedis().del(REDIS_KEYS.queue);
    await disconnectRedis();
  }
});

/**
 * Resolved at RUN time, not registration time.
 *
 * These tests were previously `it(name, { skip: skip() }, fn)`. Node's runner
 * registers `it()` synchronously inside `describe()`, so that call evaluated
 * `redisUp` *before* the `before()` hook had run — every integration test was
 * therefore skipped unconditionally, Redis up or not, and had in fact never
 * executed. `t.skip()` is reached only once the test body starts, which is after
 * `before()` has had its chance to connect.
 */
const INTEGRATION_SKIP_REASON =
  'Redis unavailable or unprefixed — skipping integration test';

describe('queue matching (Redis integration)', () => {
  it('is idempotent — re-enqueue never duplicates an entry', async (t) => {
    if (!redisUp) return t.skip(INTEGRATION_SKIP_REASON);
    await dequeue('dup-1');
    await reenqueue('dup-1');
    await reenqueue('dup-1');
    await reenqueue('dup-1');
    const size = await queueSize();
    const mine = await getRedis().lrange(REDIS_KEYS.queue, 0, -1);
    assert.equal(mine.filter((id) => id === 'dup-1').length, 1, 'duplicate queue entries');
    assert.ok(size >= 1);
    await dequeue('dup-1');
  });

  it('never lets two concurrent matchers claim the same candidate', async (t) => {
    if (!redisUp) return t.skip(INTEGRATION_SKIP_REASON);
    // Two candidates in the queue; eight matchers race for them at once.
    const candidates = ['race-a', 'race-b'];
    const matchers = Array.from({ length: 8 }, (_, i) => `racer-${i}`);

    await getRedis().del(REDIS_KEYS.queue);
    for (const id of [...candidates, ...matchers]) {
      await dequeue(id);
      await saveWaitingCard(card(id));
      await enqueue(id);
    }

    const results = await Promise.all(
      matchers.map((self) => tryMatchFromQueue(card(self, ['music', 'gaming'])))
    );

    const winners = results.filter((r): r is string => Boolean(r));

    // Each matcher either won a candidate or won nothing. A candidate can be
    // claimed at most once, and a matcher can never claim two.
    const claimed = winners.filter((w) => candidates.includes(w));
    assert.equal(
      new Set(claimed).size,
      claimed.length,
      'a candidate was claimed by more than one matcher'
    );
    assert.ok(claimed.length <= candidates.length, 'more candidates claimed than exist');
    assert.equal(
      new Set(winners).size,
      winners.length,
      'a matcher won the same candidate twice'
    );

    await getRedis().del(REDIS_KEYS.queue);
    for (const id of [...candidates, ...matchers]) {
      await getRedis().del(REDIS_KEYS.waiting(id));
    }
  });

  it('prefers the best vibe overlap', async (t) => {
    if (!redisUp) return t.skip(INTEGRATION_SKIP_REASON);
    await getRedis().del(REDIS_KEYS.queue);
    await dequeue('seeker');
    await dequeue('match-yes');
    await dequeue('match-no');

    await saveWaitingCard(card('seeker', ['music', 'gaming']));
    await saveWaitingCard(card('match-yes', ['music']));
    await saveWaitingCard(card('match-no', ['philosophy']));
    await enqueue('match-yes');
    await enqueue('match-no');
    await enqueue('seeker');

    const partner = await tryMatchFromQueue(card('seeker', ['music', 'gaming']));
    assert.equal(partner, 'match-yes');

    await getRedis().del(REDIS_KEYS.queue);
    for (const id of ['seeker', 'match-yes', 'match-no']) {
      await getRedis().del(REDIS_KEYS.waiting(id));
    }
  });

  it('never matches a user with themselves', async (t) => {
    if (!redisUp) return t.skip(INTEGRATION_SKIP_REASON);
    await getRedis().del(REDIS_KEYS.queue);
    await dequeue('narcissist');
    await saveWaitingCard(card('narcissist'));
    await enqueue('narcissist');
    assert.equal(await tryMatchFromQueue(card('narcissist')), null);
    await getRedis().del(REDIS_KEYS.queue);
  });

  it('skips a blocked candidate in both directions', async (t) => {
    if (!redisUp) return t.skip(INTEGRATION_SKIP_REASON);
    await getRedis().del(REDIS_KEYS.queue);
    for (const id of ['blocker', 'blocked', 'third']) {
      await dequeue(id);
      await saveWaitingCard(card(id));
      await enqueue(id);
    }
    await blockAnonId('blocker', 'blocked');
    await blockAnonId('blocked', 'blocker');

    const partner = await tryMatchFromQueue(card('blocker'));
    assert.notEqual(partner, 'blocked', 'matched a blocked user');

    await getRedis().del(REDIS_KEYS.queue);
    for (const id of ['blocker', 'blocked', 'third']) {
      await getRedis().del(REDIS_KEYS.waiting(id));
      await getRedis().del(REDIS_KEYS.blocked(id));
    }
  });

  /**
   * The scan window is anchored to the TAIL of the list (the longest waiters),
   * not the head. That choice is invisible on a small queue — the whole list fits
   * in the window either way — so this is the only kind of test that can catch
   * someone "optimising" it to `LRANGE 0 N`, which would silently make the
   * people who have waited longest unmatchable behind a busy queue.
   */
  it('still matches the longest waiter when the queue overflows the scan window', async (t) => {
    if (!redisUp) return t.skip(INTEGRATION_SKIP_REASON);
    await getRedis().del(REDIS_KEYS.queue);

    const OVERFLOW = 250;
    const oldest = 'overflow-oldest';
    const others = Array.from({ length: OVERFLOW - 1 }, (_, i) => `overflow-${i}`);

    // LPUSH puts the newest at the head, so `oldest` must be pushed FIRST to end
    // up deepest in the list — i.e. the furthest outside a head-anchored window.
    for (const id of [oldest, ...others]) {
      await saveWaitingCard(card(id));
      await enqueue(id);
    }

    // No vibe tags on the seeker, so every candidate scores 0 and the tie-break
    // decides: the longest wait must win.
    const partner = await tryMatchFromQueue(card('seeker'));
    assert.equal(partner, oldest, 'a head-anchored scan window would starve the longest waiter');

    await getRedis().del(REDIS_KEYS.queue);
    for (const id of [oldest, ...others]) {
      await getRedis().del(REDIS_KEYS.waiting(id));
    }
  });
});

describe('anon session lifecycle (Redis integration)', () => {
  it('round-trips a session and confirms both participants', async (t) => {
    if (!redisUp) return t.skip(INTEGRATION_SKIP_REASON);
    await createSession('sess-test', 'p1', 'p2', 'one', 'two', ['music'], ['gaming']);
    const session = await getSession('sess-test');
    assert.ok(session);
    assert.equal(session.status, 'active');
    assert.ok(isParticipant(session, 'p1'));
    assert.ok(isParticipant(session, 'p2'));
    assert.equal(isParticipant(session, 'outsider'), false);
    await endSession('sess-test');
  });

  it('clears the active-session pointer on end, but keeps identity data', async (t) => {
    if (!redisUp) return t.skip(INTEGRATION_SKIP_REASON);
    await createSession('sess-lp', 'q1', 'q2', 'one', 'two', [], []);
    await saveWaitingCard(card('q1', ['music']));
    await endSession('sess-lp');

    // The pointer is gone so a reconnect won't resume a dead match...
    assert.equal(await getRedis().get(REDIS_KEYS.activeSession('q1')), null);
    // ...but the identity survives, so the user can rejoin with the same alias.
    const kept = await getWaitingCard('q1');
    assert.equal(kept?.displayName, 'alias-q1');
    await getRedis().del(REDIS_KEYS.waiting('q1'));
  });

  it('buffers messages newest-first internally and returns them oldest-first', async (t) => {
    if (!redisUp) return t.skip(INTEGRATION_SKIP_REASON);
    // These two tests pin fixed session ids and share the buffer key, so clear it
    // first — otherwise a second run against the same Redis replays the previous
    // run's messages and fails on a phantom bug.
    await getRedis().del(REDIS_KEYS.messages('sess-msg'));
    await createSession('sess-msg', 'm1', 'm2', 'one', 'two', [], []);
    await bufferMessage('sess-msg', { from: 'm1', content: 'first', sentAt: 1 });
    await bufferMessage('sess-msg', { from: 'm2', content: 'second', sentAt: 2 });
    const messages = await getBufferedMessages('sess-msg');
    assert.deepEqual(
      messages.map((m) => m.content),
      ['first', 'second'],
      'conversation replay must read chronologically'
    );
  });

  it('caps the buffer so a long chat cannot grow Redis without bound', async (t) => {
    if (!redisUp) return t.skip(INTEGRATION_SKIP_REASON);
    await getRedis().del(REDIS_KEYS.messages('sess-cap'));
    await createSession('sess-cap', 'c1', 'c2', 'one', 'two', [], []);
    for (let i = 0; i < 60; i++) {
      await bufferMessage('sess-cap', { from: 'c1', content: `m${i}`, sentAt: i });
    }
    const messages = await getBufferedMessages('sess-cap');
    assert.equal(messages.length, 50, 'buffer should cap at TTL.maxMessages');
    assert.equal(messages[0].content, 'm10', 'oldest surviving message should be m10');
  });
});
