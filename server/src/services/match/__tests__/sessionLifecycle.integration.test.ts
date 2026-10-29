import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getRedis } from '../../../config/redis.js';
import { saveWaitingCard, getWaitingCard } from '../queue.js';
import {
  createSession,
  getSession,
  endSession,
  getBufferedMessages,
  getMessageCounts,
  getEngagedMs,
  isParticipant,
  getUserActiveSessions,
} from '../session.js';
import { recordLike } from '../like.js';
import { REDIS_KEYS, TTL } from '../keys.js';
import { meetsVibeGate } from '../vibeEligibility.js';
import { bufferTestMessage, card, skipUnlessRedis, useTestRedis } from './redisHarness.js';

/**
 * Integration tests for the anon session lifecycle (Redis).
 *
 * Split from `queue.integration.test.ts`, which OWNS `match:queue:global`. Nothing
 * here touches that key — every key used is scoped per sessionId / anonId, so this
 * file is parallel-safe with the queue suite. Keep it that way: do not enqueue.
 *
 * SAFETY: see `redisHarness.ts` — the prefix guard is mandatory.
 */

useTestRedis();

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
    assert.equal(meetsVibeGate({ engagedMs: await getEngagedMs('sess-vibe') }), false);
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

