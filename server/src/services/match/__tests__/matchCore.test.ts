import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { REDIS_KEYS, TTL } from '../keys.js';
import { meetsVibeGate, VIBE_UNLOCK } from '../vibeEligibility.js';
import { vibePairScore } from '../queue.js';
import { inspectMessage, shouldAutoReport } from '../moderation.js';
describe('redis keys', () => {
  it('namespaces every key by feature so SCAN is safe', () => {
    const anon = 'anon-1';
    const session = 'sess-1';
    const keys = [
      REDIS_KEYS.queue,
      REDIS_KEYS.waiting(anon),
      REDIS_KEYS.session(session),
      REDIS_KEYS.likes(session),
      REDIS_KEYS.messages(session),
      REDIS_KEYS.blocked(anon),
      REDIS_KEYS.activeSession(anon),
      REDIS_KEYS.presence(anon),
    ];
    for (const key of keys) {
      assert.ok(key.startsWith('match:'), `${key} is not namespaced`);
    }
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

  it('flags CSAM-adjacent terms for auto-report', () => {
    assert.equal(shouldAutoReport('minor sex'), true);
    assert.equal(shouldAutoReport('just a normal message'), false);
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
