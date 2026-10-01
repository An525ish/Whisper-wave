import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getRedis } from '../../../config/redis.js';
import {
  enqueue,
  dequeue,
  reenqueue,
  saveWaitingCard,
  getWaitingCard,
  setIdentityAlias,
  tryMatchFromQueue,
  queueSize,
} from '../queue.js';
import {
  createSession,
  getSession,
  endSession,
  bufferMessage,
  getBufferedMessages,
  isParticipant,
  getUserActiveSessions,
} from '../session.js';
import { blockAnonId } from '../block.js';
import { REDIS_KEYS } from '../keys.js';
import { card, skipUnlessRedis, useTestRedis } from './redisHarness.js';

/**
 * Integration tests for the Redis matching core.
 *
 * These exercise the property that unit tests can't: that concurrent matchers can
 * never claim the same candidate. The previous implementation relied on a
 * process-wide mutex for this; the current one relies on an atomic LREM inside a
 * Lua script, and `Promise.all` of N simultaneous matchers is the only way to
 * prove it.
 *
 * THIS FILE OWNS `match:queue:global`. Node's test runner executes test files
 * concurrently against one Redis, and that list is global to the whole app, so no
 * other suite may read or write it — two files clearing it at once make each
 * other's tests fail for no reason. `identity.integration.test.ts` therefore tests
 * the block check directly, and only the genuinely end-to-end cases live here.
 *
 * SAFETY: see `redisHarness.ts` — these tests `del` the queue key, so the prefix
 * guard is mandatory.
 */

// Safety net for the one key this file owns globally. Every test here clears it
// as well, but leaving entries behind would make the NEXT run's first assertion
// depend on what this run happened to leave.
useTestRedis(async () => {
  await getRedis().del(REDIS_KEYS.queue);
});

describe('queue matching (Redis integration)', () => {
  it('is idempotent — re-enqueue never duplicates an entry', async (t) => {
    skipUnlessRedis(t);
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
    skipUnlessRedis(t);
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
    skipUnlessRedis(t);
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
    skipUnlessRedis(t);
    await getRedis().del(REDIS_KEYS.queue);
    await dequeue('narcissist');
    await saveWaitingCard(card('narcissist'));
    await enqueue('narcissist');
    assert.equal(await tryMatchFromQueue(card('narcissist')), null);
    await getRedis().del(REDIS_KEYS.queue);
  });

  it('still matches the longest waiter when the queue overflows the scan window', async (t) => {
    skipUnlessRedis(t);
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

  /**
   * End-to-end proof of the block-survives-signing-in fix, through the real
   * matcher. The block check itself is pinned in `identity.integration.test.ts`;
   * this is here because the matcher is the only thing that proves the check is
   * actually wired into the scan rather than merely correct in isolation.
   *
   * Lives in this file because it needs `match:queue:global`, which this file
   * exclusively owns — the runner executes files in parallel against one Redis.
   */
  it('does not match a blocked account that came back on a new anonId', async (t) => {
    skipUnlessRedis(t);
    const USER = 'scan-victim-acct';
    const VICTIM_NEW = 'scan-victim-new';
    const BLOCKER = 'scan-blocker';
    const ids = [USER, VICTIM_NEW, BLOCKER, 'scan-blocker-acct', 'scan-bystander'];

    await getRedis().del(REDIS_KEYS.queue);
    for (const id of ids) {
      await dequeue(id);
      await getRedis().del(REDIS_KEYS.blocked(id));
      await getRedis().del(REDIS_KEYS.identityAlias(id));
    }

    await setIdentityAlias(BLOCKER, 'scan-blocker-acct');
    await setIdentityAlias('scan-victim-old', USER);
    await blockAnonId(BLOCKER, 'scan-victim-old');

    await saveWaitingCard({ ...card(VICTIM_NEW), userId: USER });
    await enqueue(VICTIM_NEW);
    // An unrelated person is queued too, so "not the blocked one" cannot pass
    // merely because nothing was matchable at all.
    await saveWaitingCard(card('scan-bystander'));
    await enqueue('scan-bystander');

    const partner = await tryMatchFromQueue({ ...card(BLOCKER), userId: 'scan-blocker-acct' });
    assert.notEqual(partner, VICTIM_NEW, 'a signed-in account shed its block via a new anonId');
    assert.equal(partner, 'scan-bystander', 'the unblocked candidate should still match');

    await getRedis().del(REDIS_KEYS.queue);
    for (const id of [...ids, 'scan-victim-old']) {
      await getRedis().del(REDIS_KEYS.waiting(id));
      await getRedis().del(REDIS_KEYS.blocked(id));
      await getRedis().del(REDIS_KEYS.identityAlias(id));
    }
  });

  it('never matches an account with its own other device', async (t) => {
    skipUnlessRedis(t);
    // Same person, two anonIds (phone + laptop). The anonId filter cannot see
    // that, and being handed your own other tab is the worst match bug there is.
    const MINE = 'self-scan-acct';
    const ids = ['self-laptop-1', 'self-laptop-2', 'self-stranger'];

    await getRedis().del(REDIS_KEYS.queue);
    for (const id of ids) {
      await dequeue(id);
      await getRedis().del(REDIS_KEYS.waiting(id));
    }
    await saveWaitingCard({ ...card('self-laptop-2'), userId: MINE });
    await enqueue('self-laptop-2');
    await saveWaitingCard(card('self-stranger'));
    await enqueue('self-stranger');

    const partner = await tryMatchFromQueue({ ...card('self-laptop-1'), userId: MINE });
    assert.equal(partner, 'self-stranger', 'an account must not be matched with itself');

    await getRedis().del(REDIS_KEYS.queue);
    for (const id of ids) {
      await getRedis().del(REDIS_KEYS.waiting(id));
    }
  });
});

describe('anon session lifecycle (Redis integration)', () => {
  it('round-trips a session and confirms both participants', async (t) => {
    skipUnlessRedis(t);
    await createSession({
      sessionId: 'sess-test',
      anon1: 'p1',
      anon2: 'p2',
      name1: 'one',
      name2: 'two',
      tags1: ['music'],
      tags2: ['gaming'],
    });
    const session = await getSession('sess-test');
    assert.ok(session);
    assert.equal(session.status, 'active');
    assert.ok(isParticipant(session, 'p1'));
    assert.ok(isParticipant(session, 'p2'));
    assert.equal(isParticipant(session, 'outsider'), false);
    await endSession('sess-test');
  });

  it('records the account on each side of a match, and clears it on end', async (t) => {
    skipUnlessRedis(t);
    const s = 'sess-acct';
    const u1 = 'acct-one';
    const u2 = 'acct-two';
    await getRedis().del(REDIS_KEYS.userSessions(u1));
    await getRedis().del(REDIS_KEYS.userSessions(u2));

    await createSession({
      sessionId: s,
      anon1: 'anon-one',
      anon2: 'anon-two',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
      userId1: u1,
      userId2: u2,
    });

    const session = await getSession(s);
    assert.equal(session?.userId1, u1);
    assert.equal(session?.userId2, u2);
    // The cross-device index is what lets the server ask "is this account already
    // in a match?" — the anonId pointer cannot see past one identity.
    assert.deepEqual((await getUserActiveSessions(u1, 'anon-one')).length, 0, 'own session is not a conflict');
    assert.deepEqual((await getUserActiveSessions(u1, 'anon-other')).map((x) => x.sessionId), [s]);

    await endSession(s);
    assert.equal(await getRedis().smembers(REDIS_KEYS.userSessions(u1)).then((m) => m.length), 0,
      'ending a match must not leave the account pointing at it');
  });

  it('keeps an account with no userId fully anonymous', async (t) => {
    skipUnlessRedis(t);
    const s = 'sess-anon-only';
    await createSession({
      sessionId: s,
      anon1: 'g1',
      anon2: 'g2',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
    });
    const session = await getSession(s);
    // Absent, not empty-string or null: "we do not know" must stay distinguishable
    // from "we know and there is none".
    assert.equal('userId1' in (session ?? {}), false);
    assert.equal(session?.status, 'active', 'a guest match must work exactly as before');
    await endSession(s);
  });

  it('clears the active-session pointer on end, but keeps identity data', async (t) => {
    skipUnlessRedis(t);
    await createSession({
      sessionId: 'sess-lp',
      anon1: 'q1',
      anon2: 'q2',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
    });
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
    skipUnlessRedis(t);
    // These two tests pin fixed session ids and share the buffer key, so clear it
    // first — otherwise a second run against the same Redis replays the previous
    // run's messages and fails on a phantom bug.
    await getRedis().del(REDIS_KEYS.messages('sess-msg'));
    await createSession({
      sessionId: 'sess-msg',
      anon1: 'm1',
      anon2: 'm2',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
    });
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
    skipUnlessRedis(t);
    await getRedis().del(REDIS_KEYS.messages('sess-cap'));
    await createSession({
      sessionId: 'sess-cap',
      anon1: 'c1',
      anon2: 'c2',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
    });
    for (let i = 0; i < 60; i++) {
      await bufferMessage('sess-cap', { from: 'c1', content: `m${i}`, sentAt: i });
    }
    const messages = await getBufferedMessages('sess-cap');
    assert.equal(messages.length, 50, 'buffer should cap at TTL.maxMessages');
    assert.equal(messages[0].content, 'm10', 'oldest surviving message should be m10');
  });
});

