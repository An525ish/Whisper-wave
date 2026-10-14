import { createHmac, randomInt, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';
import { makeRoomRateLimiter } from './rateLimit.js';
import type { RoomChallenge, RoomChallengeAnswer, RoomChallengeVerdict } from '../../types/room.js';

/**
 * First-post challenge for guests (D9: "allowed after alias + first-post
 * challenge").
 *
 * HONEST SCOPE: a one-line arithmetic question raises the bar against naive
 * scripted posting (a bot must parse the prompt and hold a token). It is NOT a
 * CAPTCHA and NOT Cloudflare Turnstile — a targeted bot solves it in one line.
 * It is a cost-free speed bump that sits in front of slow mode, automod and
 * bans, which are the real controls.
 *
 * Stateless: the token is `base64url(exp:a:b).mac` where
 * `mac = HMAC(key, gid|answer|exp)`. The answer is derived from the embedded
 * operands, so verification needs no server memory; the gid binds the token to
 * one guest. Single use is not enforced (whitelisting makes replays moot).
 */
const CHALLENGE_TTL_MS = 2 * 60 * 1000;
const PASSED_TTL_MS = 30 * 60 * 1000;
const MAX_PASSED = 10_000;

/** Domain-separated key: the anon JWT secret is never used raw for a second purpose. */
const KEY = createHmac('sha256', env.ANON_JWT_SECRET).update('whisperwave:rooms:challenge:v1').digest();

const mac = (gid: string, answer: number, exp: number): Buffer =>
  createHmac('sha256', KEY).update(`${gid}|${answer}|${exp}`).digest();

export const issueChallenge = (gid: string, now: number = Date.now()): RoomChallenge => {
  const a = randomInt(2, 10);
  const b = randomInt(2, 10);
  const exp = now + CHALLENGE_TTL_MS;
  const body = Buffer.from(`${exp}:${a}:${b}`).toString('base64url');
  return { token: `${body}.${mac(gid, a + b, exp).toString('base64url')}`, prompt: `${a} + ${b}` };
};

export const verifyChallenge = (
  gid: string,
  { token, answer }: RoomChallengeAnswer,
  now: number = Date.now()
): boolean => {
  const [body, sig, extra] = token.split('.');
  if (!body || !sig || extra !== undefined) return false;
  const [exp, a, b] = Buffer.from(body, 'base64url').toString().split(':').map(Number);
  if (![exp, a, b].every(Number.isInteger) || (exp as number) < now) return false;
  if (!/^\d{1,4}$/.test(answer.trim()) || Number(answer.trim()) !== (a as number) + (b as number)) return false;
  const expected = mac(gid, (a as number) + (b as number), exp as number);
  const given = Buffer.from(sig, 'base64url');
  return given.length === expected.length && timingSafeEqual(given, expected);
};

/** gid → pass expiry. Bounded; pruned by an unref'd timer. */
const passed = new Map<string, number>();
setInterval(() => {
  const now = Date.now();
  for (const [gid, until] of passed) if (until <= now) passed.delete(gid);
}, 60_000).unref();

export const markChallengePassed = (gid: string, now: number = Date.now()): void => {
  if (passed.size >= MAX_PASSED && !passed.has(gid)) {
    const oldest = passed.keys().next().value;
    if (oldest !== undefined) passed.delete(oldest);
  }
  passed.set(gid, now + PASSED_TTL_MS);
};

const hasPassed = (gid: string, now: number): boolean => (passed.get(gid) ?? 0) > now;

/** 5 wrong answers / minute per gid, then a cool-off. */
const failLimiter = makeRoomRateLimiter(5, 60_000);

/**
 * Gate one post. Members skip it; a gid that passed in the last 30 min skips
 * it; otherwise the caller gets a fresh challenge (none supplied) or a verdict
 * on the answer (wrong → new challenge, and failures are rate-limited).
 */
export const checkChallenge = (params: {
  gid: string;
  isMember: boolean;
  answer?: RoomChallengeAnswer;
  now?: number;
}): RoomChallengeVerdict => {
  const { gid, isMember, answer, now = Date.now() } = params;
  if (isMember || hasPassed(gid, now)) return { ok: true };
  if (!answer) return { ok: false, code: 'challenge_required', challenge: issueChallenge(gid, now) };
  if (verifyChallenge(gid, answer, now)) {
    markChallengePassed(gid, now);
    return { ok: true };
  }
  if (!failLimiter.allow(gid)) return { ok: false, code: 'rate_limited', retryAfterMs: 60_000 };
  return { ok: false, code: 'challenge_failed', challenge: issueChallenge(gid, now) };
};
