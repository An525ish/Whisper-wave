import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getRedis } from '../../../config/redis.js';
import {
  enqueue,
  dequeue,
  reenqueue,
  purgeQueue,
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
  getBufferedMessages,
  getMessageCounts,
  isParticipant,
  getUserActiveSessions,
} from '../session.js';
import { blockAnonId } from '../block.js';
import { recordLike } from '../like.js';
import { REDIS_KEYS, TTL } from '../keys.js';
import { meetsVibeGate, VIBE_UNLOCK } from '../vibeEligibility.js';
import type { WaitingCard } from '../../../types/match.js';
import { bufferTestMessage, card, skipUnlessRedis, useTestRedis } from './redisHarness.js';

/** The matched partner's anonId, or null — what these tests care about. */
const tryMatch = async (self: WaitingCard): Promise<string | null> => {
  const result = await tryMatchFromQueue(self);
  return result.outcome === 'matched' ? result.partnerAnonId : null;
};

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
      matchers.map((self) => tryMatch(card(self, ['music', 'gaming'])))
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

    const partner = await tryMatch(card('seeker', ['music', 'gaming']));
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
    assert.equal(await tryMatch(card('narcissist')), null);
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

    // The matcher must itself be queued (the claim checks that); it arrives last,
    // so it is at the head — outside the tail-anchored window, as in production.
    await saveWaitingCard(card('seeker'));
    await enqueue('seeker');

    // No vibe tags on the seeker, so every candidate scores 0 and the tie-break
    // decides: the longest wait must win.
    const partner = await tryMatch(card('seeker'));
    assert.equal(partner, oldest, 'a head-anchored scan window would starve the longest waiter');

    await getRedis().del(REDIS_KEYS.queue);
    for (const id of [oldest, ...others, 'seeker']) {
      await getRedis().del(REDIS_KEYS.waiting(id));
    }
  });

  it('never double-matches two joiners who are both queued and scan simultaneously', async (t) => {
    skipUnlessRedis(t);
    // The mutual-claim case: A and B are both in the queue and both scan at once.
    // Each sees the other as the best candidate. Without the "self must still be
    // queued" check in the claim, A claims B and B claims A — two sessions, and
    // each user gets two partners.
    const a = 'mutual-a';
    const b = 'mutual-b';
    await getRedis().del(REDIS_KEYS.queue);
    for (const id of [a, b]) {
      await saveWaitingCard(card(id, ['music']));
      await enqueue(id);
    }

    const results = await Promise.all([
      tryMatchFromQueue(card(a, ['music'])),
      tryMatchFromQueue(card(b, ['music'])),
    ]);

    const matched = results.filter((r) => r.outcome === 'matched');
    assert.equal(matched.length, 1, 'exactly ONE session must be formed');
    const loser = results.find((r) => r.outcome !== 'matched');
    assert.equal(loser?.outcome, 'self_claimed', 'the claimed side must stand down, not re-queue');
    assert.equal(await queueSize(), 0, 'after a pair neither anonId may remain queued');

    await getRedis().del(REDIS_KEYS.queue);
    for (const id of [a, b]) await getRedis().del(REDIS_KEYS.waiting(id));
  });

  it('never gives anyone two partners when many queued joiners scan at once', async (t) => {
    skipUnlessRedis(t);
    const ids = Array.from({ length: 8 }, (_, i) => `swarm-${i}`);
    await getRedis().del(REDIS_KEYS.queue);
    for (const id of ids) {
      await saveWaitingCard(card(id));
      await enqueue(id);
    }

    const results = await Promise.all(ids.map((id) => tryMatchFromQueue(card(id))));

    // Every pair is (matcher, claimed). Nobody may appear in two pairs, and a
    // claimed user must not also have claimed someone.
    const seen = new Set<string>();
    results.forEach((r, i) => {
      if (r.outcome !== 'matched') return;
      for (const id of [ids[i], r.partnerAnonId]) {
        assert.equal(seen.has(id), false, `${id} was placed in two pairs`);
        seen.add(id);
      }
    });
    const stillQueued = await getRedis().lrange(REDIS_KEYS.queue, 0, -1);
    for (const id of seen) assert.equal(stillQueued.includes(id), false, `${id} paired but still queued`);

    await getRedis().del(REDIS_KEYS.queue);
    for (const id of ids) await getRedis().del(REDIS_KEYS.waiting(id));
  });

  it('refuses to enqueue an anonId that already holds an active match', async (t) => {
    skipUnlessRedis(t);
    await getRedis().del(REDIS_KEYS.queue);
    await createSession({
      sessionId: 'sess-guard',
      anon1: 'guard-a',
      anon2: 'guard-b',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
    });
    assert.equal(await enqueue('guard-a'), false, 'a matched user must not re-enter the queue');
    assert.equal(await queueSize(), 0);
    await endSession('sess-guard');
    assert.equal(await enqueue('guard-a'), true, 'once the match is over they may queue again');
    await getRedis().del(REDIS_KEYS.queue);
  });

  it('purges the queue at boot', async (t) => {
    skipUnlessRedis(t);
    await getRedis().del(REDIS_KEYS.queue);
    await enqueue('ghost-1');
    await enqueue('ghost-2');
    await purgeQueue();
    assert.equal(await queueSize(), 0);
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

    await enqueue(BLOCKER);

    const partner = await tryMatch({ ...card(BLOCKER), userId: 'scan-blocker-acct' });
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

    await enqueue('self-laptop-1');

    const partner = await tryMatch({ ...card('self-laptop-1'), userId: MINE });
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
    await bufferTestMessage('sess-msg', { from: 'm1', content: 'first', sentAt: 1 });
    await bufferTestMessage('sess-msg', { from: 'm2', content: 'second', sentAt: 2 });
    const messages = await getBufferedMessages('sess-msg');
    assert.deepEqual(
      messages.map((m) => m.content),
      ['first', 'second'],
      'conversation replay must read chronologically'
    );
  });

  it('rejects a reused message id and does not count it twice', async (t) => {
    skipUnlessRedis(t);
    await getRedis().del(REDIS_KEYS.messages('sess-dup'));
    await getRedis().del(REDIS_KEYS.meta('sess-dup'));
    await createSession({
      sessionId: 'sess-dup',
      anon1: 'd1',
      anon2: 'd2',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
    });
    assert.equal(await bufferTestMessage('sess-dup', { id: 'same', from: 'd1', content: 'a', sentAt: 1 }), true);
    assert.equal(await bufferTestMessage('sess-dup', { id: 'same', from: 'd2', content: 'b', sentAt: 2 }), false);
    assert.equal((await getBufferedMessages('sess-dup')).length, 1);
    assert.deepEqual(await getMessageCounts('sess-dup'), { countA: 1, countB: 0 });
    // Messages without an id are never "duplicates" of each other.
    assert.equal(await bufferTestMessage('sess-dup', { from: 'd1', content: 'c', sentAt: 3 }), true);
    assert.equal(await bufferTestMessage('sess-dup', { from: 'd1', content: 'c', sentAt: 4 }), true);
    await endSession('sess-dup');
  });

  it('counts per side beyond the buffer cap, so the vibe gate cannot re-lock', async (t) => {
    skipUnlessRedis(t);
    await getRedis().del(REDIS_KEYS.messages('sess-vibe'));
    await getRedis().del(REDIS_KEYS.meta('sess-vibe'));
    await createSession({
      sessionId: 'sess-vibe',
      anon1: 'v1',
      anon2: 'v2',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
    });
    // 60 from one side, 2 from the other: the last-50 buffer holds none of the
    // early messages from side B's perspective, but the counters remember.
    for (let i = 0; i < 2; i++) {
      await bufferTestMessage('sess-vibe', { from: 'v2', content: `b${i}`, sentAt: i });
    }
    for (let i = 0; i < 60; i++) {
      await bufferTestMessage('sess-vibe', { from: 'v1', content: `a${i}`, sentAt: 100 + i });
    }
    const counts = await getMessageCounts('sess-vibe');
    assert.deepEqual(counts, { countA: 60, countB: 2 });
    assert.equal(
      (await getBufferedMessages('sess-vibe')).filter((m) => m.from === 'v2').length,
      0,
      'precondition: side B has fallen out of the buffer'
    );
    const old = Date.now() - VIBE_UNLOCK.minSessionMs - 1;
    assert.equal(meetsVibeGate({ createdAt: old, ...counts }), true);
    await endSession('sess-vibe');
  });

  it('deletes the transcript and counters when a session ends, keeping only the record', async (t) => {
    skipUnlessRedis(t);
    const s = 'sess-end-clean';
    await createSession({
      sessionId: s,
      anon1: 'e1',
      anon2: 'e2',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
    });
    await bufferTestMessage(s, { id: 'm-1', from: 'e1', content: 'secret', sentAt: 1 });
    await getRedis().sadd(REDIS_KEYS.likes(s), 'e1');
    assert.equal(await getRedis().exists(REDIS_KEYS.messages(s)), 1, 'precondition');

    await endSession(s);

    for (const key of [REDIS_KEYS.messages(s), REDIS_KEYS.meta(s), REDIS_KEYS.likes(s)]) {
      assert.equal(await getRedis().exists(key), 0, `${key} survived the end of its session`);
    }
    // The record is kept (briefly) so a connectToken can still resolve the anonIds.
    assert.equal((await getSession(s))?.status, 'ending');
    const ttl = await getRedis().ttl(REDIS_KEYS.session(s));
    assert.ok(ttl > 0 && ttl <= 3600, `expected a <= 1h TTL on the ended record, got ${ttl}`);
  });

  it('bounds the likes set with a TTL', async (t) => {
    skipUnlessRedis(t);
    const s = 'sess-like-ttl';
    await createSession({
      sessionId: s,
      anon1: 'l1',
      anon2: 'l2',
      name1: 'one',
      name2: 'two',
      tags1: [],
      tags2: [],
    });
    await recordLike(s, 'l1');
    const ttl = await getRedis().ttl(REDIS_KEYS.likes(s));
    assert.ok(ttl > 0 && ttl <= TTL.session, `likes key must expire, got ${ttl}`);
    await endSession(s);
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
      await bufferTestMessage('sess-cap', { from: 'c1', content: `m${i}`, sentAt: i });
    }
    const messages = await getBufferedMessages('sess-cap');
    assert.equal(messages.length, 50, 'buffer should cap at TTL.maxMessages');
    assert.equal(messages[0].content, 'm10', 'oldest surviving message should be m10');
  });
});

