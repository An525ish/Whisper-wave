import { Redis } from 'ioredis';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

/**
 * Singleton ioredis client.
 *
 * Works with any Redis-compatible service:
 *   Local dev:  redis://localhost:6379
 *   Upstash:    rediss://default:<token>@<host>.upstash.io:6379
 *
 * Uses explicit host/port/password options instead of a URL string so that
 * ioredis correctly sets TLS SNI (servername), which is required by Upstash.
 * Passing a rediss:// URL string to ioredis skips SNI negotiation and causes
 * an immediate ECONNRESET.
 *
 * `REDIS_KEY_PREFIX` namespaces every key via ioredis' own `keyPrefix`, so
 * nothing in application code has to know about it.
 */
let _redis: Redis | null = null;

export const getRedis = (): Redis => {
  if (!_redis) {
    const parsed = new URL(env.REDIS_URL);
    const isTLS = parsed.protocol === 'rediss:';

    _redis = new Redis({
      host: parsed.hostname,
      port: Number(parsed.port) || 6379,
      username: parsed.username || 'default',
      password: decodeURIComponent(parsed.password),
      // Namespace every key. Empty in production; tests set `test:` so an
      // integration run can never delete a developer's live queue.
      keyPrefix: env.REDIS_KEY_PREFIX || undefined,
      // Explicit TLS with servername for SNI — required by Upstash.
      // Cert verification stays ON by default; only disabled via REDIS_TLS_INSECURE
      // for providers with an unverifiable chain (opt-in, never silent).
      tls: isTLS
        ? { servername: parsed.hostname, rejectUnauthorized: !env.REDIS_TLS_INSECURE }
        : undefined,
      maxRetriesPerRequest: 3,
      // Bounded: an unbounded strategy means a down Redis never surfaces an
      // error to the caller, so `connectRedis` hangs instead of failing fast.
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying, surface the error
        return Math.min(times * 300, 2000);
      },
      // Only reconnect on READONLY (replica promotion failover).
      reconnectOnError(err: Error) {
        return err.message.includes('READONLY');
      },
      // Managed providers (Upstash) close idle connections after ~10 min. Without
      // this, the first anon request after a lull fails with a stale socket.
      keepAlive: 30_000,
      connectionName: 'whisper-wave',
      enableReadyCheck: true,
      lazyConnect: true,
    });

    _redis.on('error', (err: Error) => {
      logger.error({ err }, 'Redis error');
    });
    _redis.on('connect', () => logger.info('Redis connected'));
    _redis.on('ready', () => logger.info('Redis ready'));
    _redis.on('reconnecting', () => logger.warn('Redis reconnecting...'));
  }
  return _redis;
};

/** Connect + verify. Rejects on timeout instead of hanging forever. */
const probe = async (timeoutMs: number): Promise<void> => {
  const redis = getRedis();
  await Promise.race([
    (async () => {
      if (redis.status === 'wait' || redis.status === 'end') await redis.connect();
      await redis.ping();
    })(),
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`Redis did not respond within ${timeoutMs}ms`)),
        timeoutMs
      ).unref()
    ),
  ]);
};

/** Call once at server startup to verify the connection before accepting traffic. */
export const connectRedis = async (timeoutMs = 10_000): Promise<void> => {
  await probe(timeoutMs);
  logger.info('Redis ping OK');
};

/** Liveness probe for /health — never throws. */
export const redisHealth = async (): Promise<{
  ok: boolean;
  status: string;
}> => {
  try {
    const redis = getRedis();
    const pong = await Promise.race([
      redis.ping(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('ping timeout')), 2000)
      ),
    ]);
    return pong === 'PONG'
      ? { ok: true, status: redis.status }
      : { ok: false, status: `unexpected:${String(pong)}` };
  } catch (err) {
    return { ok: false, status: err instanceof Error ? err.message : 'unknown' };
  }
};

/** Graceful disconnect — call during server shutdown. */
export const disconnectRedis = async (): Promise<void> => {
  if (_redis) {
    await _redis.quit().catch((err: unknown) => {
      logger.warn({ err }, 'Redis quit failed — forcing disconnect');
      _redis?.disconnect();
    });
    _redis = null;
    logger.info('Redis disconnected');
  }
};
