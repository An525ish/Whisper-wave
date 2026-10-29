import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { REDIS_KEYS, TTL } from '../keys.js';
import { meetsEffortGate, meetsVibeGate, nextEffort, nextEngagement, VIBE_UNLOCK, type Effort } from '../vibeEligibility.js';
import { vibePairScore } from '../queue.js';
import { anonReactionSchema } from '../reaction.js';
describe('redis keys', () => {
  it('namespaces every key by feature so SCAN is safe', () => {
    const anon = 'anon-1';
    const user = 'u-1';
    const session = 'sess-1';
    const keys = [
      REDIS_KEYS.queue,
      REDIS_KEYS.waiting(anon),
      REDIS_KEYS.session(session),
      REDIS_KEYS.likes(session),
      REDIS_KEYS.messages(session),
      REDIS_KEYS.blocked(anon),
      REDIS_KEYS.blocked(user),
      REDIS_KEYS.activeSession(anon),
      REDIS_KEYS.presence(anon),
      REDIS_KEYS.userSessions(user),
      REDIS_KEYS.userWhispers(user),
      REDIS_KEYS.identityAlias(anon),
      REDIS_KEYS.reactions(session, 'msg_1'),
      REDIS_KEYS.meta(session),
      REDIS_KEYS.autoReported(session, 'sexual'),
      REDIS_KEYS.joinCounted(anon),
      REDIS_KEYS.claim(anon, session),
      REDIS_KEYS.claimIndex(anon),
    ];
    for (const key of keys) {
      assert.ok(key.startsWith('match:'), `${key} is not namespaced`);
    }
  });

  it('keeps a signed-in account off every anonId-scoped key', () => {
    // The whole dual-identity scheme rests on this: a user's account id and
    // their anonymous id must never land on the same key, or a block written for
    // one is silently read as a block on the other.
    const anon = 'anon-1';
    const user = 'u-1';
    assert.notEqual(REDIS_KEYS.blocked(anon), REDIS_KEYS.blocked(user));
    assert.notEqual(REDIS_KEYS.userSessions(user), REDIS_KEYS.blocked(user));
    assert.notEqual(REDIS_KEYS.userWhispers(user), REDIS_KEYS.userSessions(user));
    assert.notEqual(REDIS_KEYS.identityAlias(anon), REDIS_KEYS.userSessions(user));
  });

  it('keeps the whisper window and the session index on separate keys', () => {
    // Ending a match must not clear the daily count, and a window reset must not
    // make a matched account look free.
    const user = 'u-1';
    assert.notEqual(REDIS_KEYS.userWhispers(user), REDIS_KEYS.userSessions(user));
  });

  it('never lets a message id escape the reactions namespace', () => {
    // `reactions()` embeds a client-supplied id in a key. A colon or wildcard
    // there would let one message address another message's reactions, or reach
    // outside the `match:reactions:` prefix entirely. The Zod schema is the
    // enforcement point; this pins the shape it relies on.
    const key = REDIS_KEYS.reactions('sess-1', 'msg-1');
    assert.equal(key, 'match:reactions:sess-1:msg-1');
    assert.equal(key.split(':').length, 4);
  });

  it('bounds the signed-in account pointers and the reactions to the anon cookie', () => {
    // Both hold account ids; both must not outlive the identity they describe.
    assert.ok(TTL.identityAlias <= 24 * 60 * 60);
    assert.ok(TTL.reactions <= 24 * 60 * 60);
    assert.ok(TTL.whisperWindow <= 24 * 60 * 60);
  });

  it('keeps distinct concerns on distinct keys', () => {
    // A session and its anonId-scoped presence must never collide, or ending
    // one would silently clear the other.
    assert.notEqual(REDIS_KEYS.session('a'), REDIS_KEYS.activeSession('a'));
    assert.notEqual(REDIS_KEYS.presence('a'), REDIS_KEYS.activeSession('a'));
  });

  it('keeps the identity card alive at least as long as the anon cookie', () => {
    // The anonId cookie is 24 h. If the identity card expired first, a
    // reconnecting user would have no alias and the socket would dead-end.
    assert.ok(TTL.waiting >= 24 * 60 * 60);
  });

  it('gives a dropped socket long enough to come back', () => {
    assert.ok(TTL.presence >= 30, 'too short to survive a real network blip');
    assert.ok(TTL.presence <= 120, 'too long to leave a closed tab in limbo');
  });
});

describe('vibe eligibility gate', () => {
  it('stays locked below five minutes of flow', () => {
    assert.equal(meetsVibeGate({ engagedMs: VIBE_UNLOCK.engagedMs - VIBE_UNLOCK.skewMs - 1 }), false);
  });

  it('unlocks at the threshold', () => {
    assert.equal(meetsVibeGate({ engagedMs: VIBE_UNLOCK.engagedMs }), true);
  });

  it('only counts quick replies from the other side', () => {
    let e = nextEngagement(null, 'a', 0);
    e = nextEngagement(e, 'a', 10_000); // same sender: no time
    assert.equal(e.engagedMs, 0);
    e = nextEngagement(e, 'b', 30_000); // reply after 20s
    assert.equal(e.engagedMs, 20_000);
    e = nextEngagement(e, 'a', 30_000 + VIBE_UNLOCK.maxGapMs + 1); // too slow: pauses
    assert.equal(e.engagedMs, 20_000);
  });
});

describe('vibe overlap scoring', () => {
  it('is case insensitive', () => {
    assert.equal(vibePairScore(['Deep_Talks'], ['deep_talks']), 1);
  });

  it('counts only shared tags', () => {
    assert.equal(vibePairScore(['music', 'gaming'], ['music', 'coding']), 1);
  });

  it('handles empty tag sets without throwing', () => {
    assert.equal(vibePairScore([], ['music']), 0);
    assert.equal(vibePairScore(['music'], []), 0);
    assert.equal(vibePairScore([], []), 0);
  });

  it('never double counts a repeated tag', () => {
    assert.equal(vibePairScore(['music'], ['music', 'music']), 1);
  });
});

describe('vibe reaction validation', () => {
  it('accepts any single emoji, including skin tones, flags, ZWJ and keycaps', () => {
    for (const reaction of ['🔥', '❤️', '👍🏽', '🏳️\u200d🌈', '👨\u200d👩\u200d👧', '🇮🇳', '1️⃣', '🫠']) {
      const parsed = anonReactionSchema.safeParse({ messageId: 'msg-1', reaction });
      assert.equal(parsed.success, true, `${reaction} should be accepted`);
    }
  });

  it('rejects text, mixed text and emoji, and several emoji', () => {
    // The client can put exactly one emoji in someone else's bubble, never words.
    for (const reaction of ['porn', 'slay ', 'SLAY', 'kill', '', '🫠🫠', '🔥x', 'x🔥', 'a', ' 🔥', '🔥\n']) {
      const parsed = anonReactionSchema.safeParse({ messageId: 'msg-1', reaction });
      assert.equal(parsed.success, false, `${JSON.stringify(reaction)} must be rejected`);
    }
  });

  it('rejects a missing or malformed reaction', () => {
    for (const payload of [
      { messageId: 'msg-1' },
      { reaction: '🔥' },
      { messageId: 'msg-1', reaction: undefined },
      {},
    ]) {
      assert.equal(anonReactionSchema.safeParse(payload).success, false, JSON.stringify(payload));
    }
  });

  it('rejects a message id that could escape the reactions key namespace', () => {
    // A crafted id is the only way to address another message's reaction set, or
    // to write outside `match:reactions:` entirely.
    for (const messageId of [
      'a:b',
      'match:reactions:sess-x',
      '*',
      '?',
      'msg 1',
      'msg/1',
      'msg\n1',
      "msg'1",
      '',
      'x'.repeat(65),
    ]) {
      const parsed = anonReactionSchema.safeParse({ messageId, reaction: '🔥' });
      assert.equal(parsed.success, false, `${JSON.stringify(messageId)} must be rejected`);
    }
  });

  it('accepts a realistic client-generated id', () => {
    // Ids come from the client, so the safe shape has to be the one real clients
    // produce (uuid, nanoid, timestamp+counter).
    for (const messageId of ['a', 'msg-1', 'msg_1', '550e8400-e29b-41d4-a716-446655440000', '1'.repeat(64)]) {
      assert.equal(
        anonReactionSchema.safeParse({ messageId, reaction: '🔥' }).success,
        true,
        messageId
      );
    }
  });
});

describe('one-sided effort gate', () => {
  const line = (i: number) => `this is a real message number ${i}`;
  const run = (gapMs: number, n: number, content = line) => {
    let e: Effort | null = null;
    for (let i = 0; i < n; i++) e = nextEffort(e, content(i), false, 1_000 + i * gapMs);
    return e;
  };
  it('unlocks after 15 distinct real messages spread over 2 minutes', () => {
    assert.equal(meetsEffortGate(run(10_000, 15)), true);
  });
  it('ignores a flood, repeats, short lines and photos', () => {
    assert.equal(meetsEffortGate(run(1_000, 15)), false);
    assert.equal(meetsEffortGate(run(10_000, 30, () => 'the same long line again')), false);
    assert.equal(meetsEffortGate(run(10_000, 30, () => 'hi')), false);
    assert.equal(nextEffort(null, line(1), true, 1), null);
  });
});
