import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { REDIS_KEYS, TTL } from '../keys.js';
import { meetsVibeGate, VIBE_UNLOCK } from '../vibeEligibility.js';
import { vibePairScore } from '../queue.js';
import { inspectMessage } from '../moderation.js';
import { anonReactionSchema } from '../reaction.js';
import { ANON_REACTIONS } from '../../../constants/anon-reactions.js';
import { toWireMessage } from '../messaging.js';
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
      REDIS_KEYS.claim(anon),
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
  const now = 1_000_000;
  // Just past the warm-up window.
  const old = now - VIBE_UNLOCK.minSessionMs - 1;
  // The lowest combination that satisfies every rule: 2 each clears the
  // per-side floor, and 3+2 clears the 5-message total (i.e. at least one
  // person has to have carried more than the bare minimum).
  const min = { countA: 3, countB: 2 };

  it('blocks a like inside the warm-up window even with lots of messages', () => {
    assert.equal(
      meetsVibeGate({ createdAt: now - 1000, countA: 20, countB: 20, now }),
      false
    );
  });

  it('blocks a like when one side has not participated', () => {
    assert.equal(meetsVibeGate({ createdAt: old, countA: 10, countB: 1, now }), false);
    assert.equal(meetsVibeGate({ createdAt: old, countA: 1, countB: 10, now }), false);
  });

  it('blocks a one-sided monologue even past the message floor', () => {
    // 6 messages but all from one person — the exact spam pattern we want to
    // stop funnelling into a mutual DM.
    assert.equal(meetsVibeGate({ createdAt: old, countA: 6, countB: 0, now }), false);
  });

  it('requires at least one side past the bare per-side minimum', () => {
    // 2 each satisfies minMessagesPerSide but not minTotalMessages.
    assert.equal(meetsVibeGate({ createdAt: old, countA: 2, countB: 2, now }), false);
    assert.equal(meetsVibeGate({ createdAt: old, ...min, now }), true);
  });

  it('unlocks at exactly the time threshold', () => {
    const exact = now - VIBE_UNLOCK.minSessionMs;
    assert.equal(meetsVibeGate({ createdAt: exact, ...min, now }), true);
  });

  it('stays locked one millisecond before the threshold', () => {
    const justEarly = now - VIBE_UNLOCK.minSessionMs + 1;
    assert.equal(meetsVibeGate({ createdAt: justEarly, ...min, now }), false);
  });

  it('is symmetric — swapping who sent what does not change the verdict', () => {
    assert.equal(
      meetsVibeGate({ createdAt: old, countA: 3, countB: 2, now }),
      meetsVibeGate({ createdAt: old, countA: 2, countB: 3, now })
    );
  });

  it('does not unlock at 1 message each regardless of time', () => {
    assert.equal(meetsVibeGate({ createdAt: old, countA: 1, countB: 1, now }), false);
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

describe('vibe reaction whitelist', () => {
  it('accepts every curated reaction', () => {
    for (const reaction of ANON_REACTIONS) {
      const parsed = anonReactionSchema.safeParse({ messageId: 'msg-1', reaction });
      assert.equal(parsed.success, true, `${reaction} should be accepted`);
    }
  });

  it('rejects an emoji the client made up', () => {
    // The whole point of a whitelist: the client cannot put an arbitrary glyph
    // into someone else's bubble, which is a moderation surface with no
    // moderation behind it.
    for (const reaction of ['🔥', 'porn', 'slay ', 'SLAY', 'kill', '', '🫠🫠']) {
      const parsed = anonReactionSchema.safeParse({ messageId: 'msg-1', reaction });
      assert.equal(parsed.success, false, `${JSON.stringify(reaction)} must be rejected`);
    }
  });

  it('rejects a reaction outside the set even when it is a real emoji', () => {
    // A well-formed emoji is not a curated one. Real emoji the product has not
    // chosen are still refused.
    for (const reaction of ['💀', '👍', '❤️', '🙌']) {
      if ((ANON_REACTIONS as readonly string[]).includes(reaction)) continue;
      assert.equal(anonReactionSchema.safeParse({ messageId: 'msg-1', reaction }).success, false);
    }
  });

  it('rejects a missing or malformed reaction', () => {
    for (const payload of [
      { messageId: 'msg-1' },
      { reaction: 'fire' },
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
      const parsed = anonReactionSchema.safeParse({ messageId, reaction: 'fire' });
      assert.equal(parsed.success, false, `${JSON.stringify(messageId)} must be rejected`);
    }
  });

  it('accepts a realistic client-generated id', () => {
    // Ids come from the client, so the safe shape has to be the one real clients
    // produce (uuid, nanoid, timestamp+counter).
    for (const messageId of ['a', 'msg-1', 'msg_1', '550e8400-e29b-41d4-a716-446655440000', '1'.repeat(64)]) {
      assert.equal(
        anonReactionSchema.safeParse({ messageId, reaction: 'fire' }).success,
        true,
        messageId
      );
    }
  });

  it('stays a small curated set, not an emoji keyboard', () => {
    assert.ok(ANON_REACTIONS.length >= 3, 'too few to be a reaction bar');
    assert.ok(ANON_REACTIONS.length <= 8, 'too many to be a curated set');
    assert.equal(new Set(ANON_REACTIONS).size, ANON_REACTIONS.length, 'duplicate reaction key');
  });
});

describe('anon message moderation', () => {
  it('allows ordinary conversation', () => {
    for (const msg of [
      'hey, what are you listening to?',
      'i think that film was overrated',
      'my dog is named Biscuit',
    ]) {
      assert.deepEqual(inspectMessage(msg), { allowed: true }, msg);
    }
  });

  it('blocks explicit sexual solicitation', () => {
    assert.equal(inspectMessage('send nudes').allowed, false);
    assert.equal(inspectMessage('wanna sexting?').allowed, false);
  });

  it('blocks contact/payment solicitation — the classic anon-chat scam', () => {
    assert.equal(inspectMessage('add me on telegram').allowed, false);
    assert.equal(inspectMessage('send money via western union').allowed, false);
  });

  it('sees through leetspeak and separator soup', () => {
    assert.equal(inspectMessage('p0rn').allowed, false);
    assert.equal(inspectMessage('s-e-x chat').allowed, false);
    assert.equal(inspectMessage('S.E.X. chat').allowed, false);
    assert.equal(inspectMessage('add me on t3legram').allowed, false);
  });

  it('marks CSAM-adjacent terms severe, so they are blocked AND auto-reported', () => {
    for (const msg of ['minor sex', 'child porn', 'you pedo', 'im a pedophile', 'loli']) {
      const verdict = inspectMessage(msg);
      assert.equal(verdict.allowed, false, `${msg} must be blocked, not delivered`);
      if (!verdict.allowed) assert.equal(verdict.severe, true, `${msg} must be severe`);
    }
    assert.deepEqual(inspectMessage('just a normal message'), { allowed: true });
  });

  it('does NOT auto-report contact or scam solicitation — blocked only', () => {
    // Auto-reporting these would let one spammer flood the review queue.
    for (const msg of ['add me on telegram', 'send money via western union', 'buy btc']) {
      const verdict = inspectMessage(msg);
      assert.equal(verdict.allowed, false, msg);
      if (!verdict.allowed) assert.equal(verdict.severe, false, `${msg} must not be severe`);
    }
    const lesser = inspectMessage('send nudes');
    assert.equal(lesser.allowed === false && lesser.severe, false);
  });

  it('does not flag ordinary words that merely contain a blocked term', () => {
    // Substring matching blocked all of these. Word boundaries do not.
    for (const msg of [
      'grape soda',
      'i love grapes',
      'scrape the pan',
      'new drapes',
      'that was therapeutic',
      'a torpedo sank it',
      'my pedometer says 9k steps',
      'a lollipop',
      'okay, kysmet',
      'cryptography is fun',
      'the analyst',
    ]) {
      assert.deepEqual(inspectMessage(msg), { allowed: true }, msg);
    }
  });

  it('still catches a term that carries punctuation or sits inside a sentence', () => {
    assert.equal(inspectMessage('send nudes!').allowed, false);
    assert.equal(inspectMessage('lol, rape.').allowed, false);
    assert.equal(inspectMessage('you are a pedo').allowed, false);
  });

  it('still catches genuinely obfuscated terms after normalising', () => {
    for (const msg of ['p3d0', 'r@pe', 'n.u.d.e.s pls', 'l0li', 'p e d o', 'k.y.s']) {
      assert.equal(inspectMessage(msg).allowed, false, msg);
    }
  });

  it('does not glue ordinary single letters into a blocked word', () => {
    assert.deepEqual(inspectMessage('plan b i guess'), { allowed: true });
    assert.deepEqual(inspectMessage('i a m fine'), { allowed: true });
  });

  it('reports a coarse reason without echoing the offending text', () => {
    const verdict = inspectMessage('send nudes');
    assert.equal(verdict.allowed, false);
    if (!verdict.allowed) {
      assert.equal(verdict.reason, 'sexual');
      // The reason is a category, never the message — it is safe to log.
      assert.equal(JSON.stringify(verdict).includes('nude'), false);
    }
  });

  it('handles unicode and emoji without throwing', () => {
    assert.deepEqual(inspectMessage('héllo 👋🏽 世界'), { allowed: true });
    assert.deepEqual(inspectMessage(''), { allowed: true });
    assert.deepEqual(inspectMessage(' '.repeat(500)), { allowed: true });
  });
});

describe('per-recipient message sides', () => {
  const stored = { id: 'm1', from: 'anon-a', content: 'hi', sentAt: 5 };

  it('labels the sender me and everyone else them, without leaking the id', () => {
    assert.deepEqual(toWireMessage(stored, 'anon-a'), { id: 'm1', from: 'me', content: 'hi', sentAt: 5 });
    const forPartner = toWireMessage(stored, 'anon-b');
    assert.equal(forPartner.from, 'them');
    assert.equal(JSON.stringify(forPartner).includes('anon-'), false, 'an anonId leaked');
  });

  it('omits id when the stored message has none', () => {
    assert.equal('id' in toWireMessage({ from: 'x', content: 'c', sentAt: 1 }, 'x'), false);
  });
});
