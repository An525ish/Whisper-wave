import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { checkChallenge } from '../challenge.js';
import { resolveChallengeSettings, verifyTurnstileToken } from '../turnstile.js';
import { roomMessageSchema } from '../../../validators/rooms.js';
import type { ChallengeSettings } from '../../../types/room.js';

const settings: ChallengeSettings = { provider: 'turnstile', siteKey: 'site', secretKey: 'secret' };
const reply = (body: unknown, status = 200): typeof fetch => async () =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const down: typeof fetch = async () => {
  throw new DOMException('timed out', 'TimeoutError');
};
const turnstile = (token = 'tok') => ({ provider: 'turnstile' as const, token });

describe('challenge provider selection', () => {
  it('needs both keys for turnstile, else arithmetic', () => {
    assert.deepStrictEqual(resolveChallengeSettings({ TURNSTILE_SITE_KEY: 's', TURNSTILE_SECRET_KEY: 'k' }), {
      provider: 'turnstile',
      siteKey: 's',
      secretKey: 'k',
    });
    assert.equal(resolveChallengeSettings({ TURNSTILE_SITE_KEY: 's', TURNSTILE_SECRET_KEY: ' ' }).provider, 'arithmetic');
    assert.equal(resolveChallengeSettings({ TURNSTILE_SITE_KEY: '', TURNSTILE_SECRET_KEY: '' }).provider, 'arithmetic');
  });
});

describe('verifyTurnstileToken', () => {
  it('posts form-encoded secret/response/idempotency_key (+ remoteip) and maps outcomes', async () => {
    let seen: { url: string; body: URLSearchParams } | undefined;
    const spy: typeof fetch = async (url, init) => {
      seen = { url: String(url), body: init?.body as URLSearchParams };
      return new Response(JSON.stringify({ success: true }));
    };
    assert.equal(await verifyTurnstileToken({ secret: 's', token: 't', remoteIp: '1.2.3.4', fetchImpl: spy }), 'success');
    assert.equal(seen?.url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    assert.equal(seen?.body.get('secret'), 's');
    assert.equal(seen?.body.get('response'), 't');
    assert.equal(seen?.body.get('remoteip'), '1.2.3.4');
    assert.match(seen?.body.get('idempotency_key') ?? '', /^[0-9a-f-]{36}$/);

    const wrong = reply({ success: false, 'error-codes': ['timeout-or-duplicate'] });
    assert.equal(await verifyTurnstileToken({ secret: 's', token: 't', fetchImpl: wrong }), 'failed');
  });

  it('fails closed as unavailable on network error, 5xx, junk and server-side error codes', async () => {
    const run = (f: typeof fetch) => verifyTurnstileToken({ secret: 's', token: 't', fetchImpl: f });
    assert.equal(await run(down), 'unavailable');
    assert.equal(await run(reply({ success: true }, 503)), 'unavailable');
    assert.equal(await run(reply({ nope: 1 })), 'unavailable');
    assert.equal(await run(reply({ success: false, 'error-codes': ['invalid-input-secret'] })), 'unavailable');
  });
});

describe('turnstile gate', () => {
  it('issues the site key, passes on success, and whitelists the gid', async () => {
    const first = await checkChallenge({ gid: 'ts-1', isMember: false, settings });
    assert.ok(!first.ok && first.code === 'challenge_required');
    assert.deepStrictEqual(first.challenge, { provider: 'turnstile', siteKey: 'site' });
    const ok = await checkChallenge({ gid: 'ts-1', isMember: false, settings, answer: turnstile(), fetchImpl: reply({ success: true }) });
    assert.deepStrictEqual(ok, { ok: true });
    assert.deepStrictEqual(await checkChallenge({ gid: 'ts-1', isMember: false, settings, fetchImpl: down }), { ok: true });
  });

  it('wrong token -> challenge_failed with a new challenge; outage -> challenge_unavailable', async () => {
    const bad = await checkChallenge({
      gid: 'ts-2', isMember: false, settings, answer: turnstile(), fetchImpl: reply({ success: false, 'error-codes': ['invalid-input-response'] }),
    });
    assert.ok(!bad.ok && bad.code === 'challenge_failed' && bad.challenge?.provider === 'turnstile');
    const out = await checkChallenge({ gid: 'ts-3', isMember: false, settings, answer: turnstile(), fetchImpl: down });
    assert.ok(!out.ok && out.code === 'challenge_unavailable' && out.challenge?.provider === 'turnstile');
  });

  it('rejects an arithmetic answer under turnstile and rate-limits repeated failures', async () => {
    let verdict = await checkChallenge({ gid: 'ts-4', isMember: false, settings, answer: { token: 'a.b', answer: '1' }, fetchImpl: down });
    assert.ok(!verdict.ok && verdict.code === 'challenge_failed');
    for (let i = 0; i < 6; i += 1) {
      verdict = await checkChallenge({ gid: 'ts-4', isMember: false, settings, answer: turnstile(), fetchImpl: down });
    }
    assert.ok(!verdict.ok && verdict.code === 'rate_limited');
  });
});

describe('roomMessageSchema.challenge union', () => {
  const parse = (challenge: unknown) => roomMessageSchema.safeParse({ text: 'hi', challenge }).success;
  it('accepts both provider shapes and bounds the token', () => {
    assert.equal(parse({ provider: 'turnstile', token: 'x'.repeat(2048) }), true);
    assert.equal(parse({ provider: 'turnstile', token: 'x'.repeat(2049) }), false);
    assert.equal(parse({ provider: 'turnstile', token: '' }), false);
    assert.equal(parse({ token: 'a.b', answer: '4' }), true);
    assert.equal(parse({ provider: 'arithmetic', token: 'a.b', answer: '4' }), true);
    assert.equal(parse({ provider: 'turnstile', answer: '4' }), false);
  });
});
