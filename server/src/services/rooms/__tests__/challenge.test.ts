import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkChallenge,
  issueArithmeticChallenge as issueChallenge,
  markChallengePassed,
  verifyChallenge,
} from '../challenge.js';

const solve = (prompt: string): string => String(prompt.split(' + ').map(Number).reduce((a, b) => a + b, 0));

describe('first-post challenge', () => {
  it('issues a small sum and verifies the right answer for that gid only', () => {
    const { token, prompt } = issueChallenge('cg-1');
    assert.match(prompt, /^\d \+ \d$/);
    assert.equal(verifyChallenge('cg-1', { token, answer: solve(prompt) }), true);
    assert.equal(verifyChallenge('cg-1', { token, answer: ' ' + solve(prompt) + ' ' }), true);
    assert.equal(verifyChallenge('cg-1', { token, answer: '99' }), false);
    assert.equal(verifyChallenge('cg-other', { token, answer: solve(prompt) }), false);
  });

  it('rejects expired, tampered and malformed tokens', () => {
    const now = Date.now();
    const { token, prompt } = issueChallenge('cg-2', now);
    const answer = solve(prompt);
    assert.equal(verifyChallenge('cg-2', { token, answer }, now + 2 * 60_000 + 1), false);
    const [body, sig] = token.split('.');
    const forged = Buffer.from(`${now + 1e9}:2:2`).toString('base64url');
    assert.equal(verifyChallenge('cg-2', { token: `${forged}.${sig}`, answer: '4' }), false);
    assert.equal(verifyChallenge('cg-2', { token: body ?? '', answer }), false);
    assert.equal(verifyChallenge('cg-2', { token: 'x.y.z', answer }), false);
    assert.equal(verifyChallenge('cg-2', { token, answer: 'abc' }), false);
  });

  it('gates guests, waves members and passed gids through, and rate-limits wrong answers', async () => {
    assert.deepStrictEqual(await checkChallenge({ gid: 'cg-3', isMember: true }), { ok: true });
    const first = await checkChallenge({ gid: 'cg-3', isMember: false });
    assert.ok(!first.ok && first.code === 'challenge_required' && first.challenge);

    let verdict = await checkChallenge({ gid: 'cg-4', isMember: false, answer: { token: 'a.b', answer: '1' } });
    assert.ok(!verdict.ok && verdict.code === 'challenge_failed' && verdict.challenge);
    for (let i = 0; i < 6; i += 1) {
      verdict = await checkChallenge({ gid: 'cg-4', isMember: false, answer: { token: 'a.b', answer: '1' } });
    }
    assert.ok(!verdict.ok && verdict.code === 'rate_limited' && verdict.retryAfterMs);

    markChallengePassed('cg-5');
    assert.deepStrictEqual(await checkChallenge({ gid: 'cg-5', isMember: false }), { ok: true });
    const later = Date.now() + 31 * 60_000;
    assert.ok(!(await checkChallenge({ gid: 'cg-5', isMember: false, now: later })).ok);
  });
});
