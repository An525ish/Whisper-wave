import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import type { ChallengeSettings, TurnstileOutcome } from '../../types/room.js';

/**
 * Cloudflare Turnstile server-side verification for the guest first-post
 * challenge (HUB_PLAN D9). Free; optional — without both keys the stateless
 * arithmetic fallback in `challenge.ts` runs instead.
 *
 * Fails CLOSED: if Cloudflare cannot be reached the guest is told to retry
 * (`challenge_unavailable`), never waved through. Tokens and secrets are never
 * logged.
 */
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const VERIFY_TIMEOUT_MS = 4_000;

const verifyResponseSchema = z.object({
  success: z.boolean(),
  'error-codes': z.array(z.string()).optional(),
});

/** Cloudflare error codes that mean OUR side is broken (bad secret / their outage), not a wrong token. */
const SERVER_SIDE_ERRORS = new Set(['missing-input-secret', 'invalid-input-secret', 'internal-error']);

/** Pure: both keys must be present, else the arithmetic fallback. */
export const resolveChallengeSettings = (input: {
  TURNSTILE_SITE_KEY: string;
  TURNSTILE_SECRET_KEY: string;
}): ChallengeSettings => {
  const siteKey = input.TURNSTILE_SITE_KEY.trim();
  const secretKey = input.TURNSTILE_SECRET_KEY.trim();
  return siteKey && secretKey ? { provider: 'turnstile', siteKey, secretKey } : { provider: 'arithmetic' };
};

/** Resolved once at boot from env. */
export const challengeSettings: ChallengeSettings = resolveChallengeSettings(env);

/** One siteverify round trip. `fetchImpl` is injectable for tests (no network). */
export const verifyTurnstileToken = async (params: {
  secret: string;
  token: string;
  remoteIp?: string;
  fetchImpl?: typeof fetch;
}): Promise<TurnstileOutcome> => {
  const { secret, token, remoteIp, fetchImpl = fetch } = params;
  const body = new URLSearchParams({ secret, response: token, idempotency_key: randomUUID() });
  if (remoteIp) body.set('remoteip', remoteIp);
  try {
    const res = await fetchImpl(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS),
    });
    if (!res.ok) {
      logger.warn({ status: res.status }, 'Turnstile siteverify non-2xx');
      return 'unavailable';
    }
    const parsed = verifyResponseSchema.safeParse(await res.json());
    if (!parsed.success) {
      logger.warn('Turnstile siteverify returned an unexpected body');
      return 'unavailable';
    }
    if (parsed.data.success) return 'success';
    const codes = parsed.data['error-codes'] ?? [];
    if (codes.some((c) => SERVER_SIDE_ERRORS.has(c))) {
      logger.error({ codes }, 'Turnstile siteverify rejected our request');
      return 'unavailable';
    }
    return 'failed';
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.name : 'unknown' }, 'Turnstile siteverify unreachable');
    return 'unavailable';
  }
};
