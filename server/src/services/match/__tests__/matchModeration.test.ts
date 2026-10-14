import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { inspectMessage } from '../moderation.js';
import { toWireMessage } from '../messaging.js';

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
