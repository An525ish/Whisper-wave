import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DB_URI: z.string().min(1, 'DB_URI is required'),
  ACCESS_TOKEN_SECRET: z
    .string()
    .min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters'),
  ADMIN_SECRET: z
    .string()
    .default('')
    .refine((value) => value === '' || value.length >= 16, {
      message: 'ADMIN_SECRET must be at least 16 characters when set',
    }),
  ADMIN_TOKEN_SECRET: z
    .string()
    .min(32, 'ADMIN_TOKEN_SECRET must be at least 32 characters')
    .optional(),
  CLIENT_URL: z.string().optional().default(''),
  // Number of reverse-proxy hops in front of the app (Express `trust proxy`).
  // Per-IP rate limits key off the client IP, so this must match the deploy.
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).default(1),
  // Cloudflare R2 (S3-compatible object storage)
  R2_ACCOUNT_ID: z.string().min(1, 'R2_ACCOUNT_ID is required'),
  R2_ACCESS_KEY_ID: z.string().min(1, 'R2_ACCESS_KEY_ID is required'),
  R2_SECRET_ACCESS_KEY: z.string().min(1, 'R2_SECRET_ACCESS_KEY is required'),
  R2_BUCKET: z.string().min(1, 'R2_BUCKET is required'),
  // ImageKit delivery base URL, e.g. https://ik.imagekit.io/yourId
  IMAGEKIT_URL_ENDPOINT: z.string().url('IMAGEKIT_URL_ENDPOINT must be a valid URL'),
  // Redis — ioredis connection string (redis:// or rediss:// for TLS)
  // Local dev: redis://localhost:6379   Upstash/Redis Cloud: rediss://default:token@host:port
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  // Set to 'true' ONLY if your Redis provider serves a cert chain Node can't
  // verify. Defaults to secure (full TLS verification). Most managed providers
  // (incl. Upstash) present valid certs, so leave this unset in production.
  REDIS_TLS_INSECURE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // Namespace every Redis key. Defaults to nothing in production; tests set a
  // distinct prefix so `npm test` can never wipe a developer's live queue.
  REDIS_KEY_PREFIX: z.string().default(''),
  // Separate JWT secret for short-lived anonymous connectTokens
  ANON_JWT_SECRET: z.string().min(32, 'ANON_JWT_SECRET must be at least 32 characters'),
  // How long a connectToken stays valid after mutual like (minutes)
  ANON_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(10),
  // Hub surfaces ship dark: each is off until its flag is 'true', and flipping it
  // off again is the incident switch (see docs/HUB_PLAN.md §4). The client reads
  // the resolved values from GET /api/hub/summary and hides what is disabled.
  FEATURE_ROOMS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  FEATURE_GAMES: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  FEATURE_MEMES: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
  // Stable guest id lifetime (days). Long enough that a ban outlives the 24 h
  // anonId rotation it is meant to survive (see docs/HUB_PLAN.md §6.3).
  GID_COOKIE_TTL_DAYS: z.coerce.number().int().positive().default(30),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default(''),
  GMAIL_CLIENT_SECRET: z.string().optional().default(''),
  GMAIL_REFRESH_TOKEN: z.string().optional().default(''),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

/**
 * In test mode, fall back to inert placeholders instead of exiting.
 *
 * The unit suite exercises pure logic (tag scoring, moderation, the vibe gate)
 * that has no business needing real credentials, and importing any module that
 * transitively touches this file would otherwise kill the process before a
 * single assertion ran. Production and development keep the hard failure —
 * booting with a missing secret is never acceptable outside tests.
 */
const isTest = process.env.NODE_ENV === 'test';

// Admin cookies must be signed with their own secret in production; a shared
// secret means a leaked user-token secret also forges admin sessions.
if (parsed.success && parsed.data.NODE_ENV === 'production' && !parsed.data.ADMIN_TOKEN_SECRET) {
  console.error('ADMIN_TOKEN_SECRET is required in production (min 32 characters).');
  process.exit(1);
}

if (!parsed.success) {
  if (isTest) {
    console.warn(
      '[env] NODE_ENV=test with an incomplete environment — using inert placeholders. Never do this outside tests.'
    );
  } else {
    console.error('Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
}

/** Placeholder-only shape used when running tests without a real environment. */
const testFallback = {
  PORT: 8080,
  NODE_ENV: 'test' as const,
  DB_URI: 'mongodb://localhost:27017/test',
  ACCESS_TOKEN_SECRET: 'test-access-secret-long-enough-000000',
  ADMIN_SECRET: '',
  ADMIN_TOKEN_SECRET: undefined,
  CLIENT_URL: '',
  TRUST_PROXY_HOPS: 1,
  R2_ACCOUNT_ID: 'test',
  R2_ACCESS_KEY_ID: 'test',
  R2_SECRET_ACCESS_KEY: 'test',
  R2_BUCKET: 'test',
  IMAGEKIT_URL_ENDPOINT: 'https://example.test',
  REDIS_URL: 'redis://localhost:6379',
  REDIS_KEY_PREFIX: 'test:',
  REDIS_TLS_INSECURE: false,
  ANON_JWT_SECRET: 'test-anon-secret-long-enough-00000000',
  ANON_TOKEN_TTL_MIN: 10,
  FEATURE_ROOMS: false,
  FEATURE_GAMES: false,
  FEATURE_MEMES: false,
  GID_COOKIE_TTL_DAYS: 30,
  SMTP_HOST: '',
  SMTP_PORT: 587,
  SMTP_USER: '',
  SMTP_PASS: '',
  SMTP_FROM: '',
  GMAIL_CLIENT_SECRET: '',
  GMAIL_REFRESH_TOKEN: '',
  GOOGLE_CLIENT_ID: '',
};

export const env = parsed.success ? parsed.data : testFallback;
export const isProd = env.NODE_ENV === 'production';

/** JWT secret for admin cookies.
 *  Production requires ADMIN_TOKEN_SECRET (enforced above). Dev/test fall back
 *  to ACCESS_TOKEN_SECRET with a warning. */
export const adminTokenSecret = (() => {
  if (!env.ADMIN_TOKEN_SECRET) {
    if (!isTest) {
      console.warn(
        '[SECURITY] ADMIN_TOKEN_SECRET is not set; falling back to ACCESS_TOKEN_SECRET (dev only).'
      );
    }
    return env.ACCESS_TOKEN_SECRET;
  }
  return env.ADMIN_TOKEN_SECRET;
})();
