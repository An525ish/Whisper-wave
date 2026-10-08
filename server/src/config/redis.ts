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
      // Reconnect FOREVER with a capped backoff. Giving up after a few attempts
      // left a one-minute Redis blip as a permanently dead client that only a
      // process restart could revive. Individual commands still fail fast
      // (`maxRetriesPerRequest`), so callers get an error, not a hang; and boot
      // still fails fast because `connectRedis` bounds ITS probe with a timeout
      // rather than relying on this strategy giving up.
      retryStrategy(times) {
        return Math.min(times * 300, 5000);
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
    _redis.on('reconnecting', (delayMs: number) =>
      logger.warn({ delayMs }, 'Redis reconnecting...')
    );
    _redis.on('end', () => logger.warn('Redis connection ended'));
  }
  return _redis;
};

/**
 * Connect + verify. Rejects on timeout instead of hanging forever.
 *
 * The timeout lives HERE, not in the retry strategy: with unbounded reconnects the
 * initial `connect()` never rejects on its own, so this race is what makes a boot
 * against a dead Redis fail fast. The client keeps retrying in the background
 * after a timeout, which is what lets a dev server recover when Redis comes up.
 */
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

/** Redis reachability probe for /health and /ready — never throws. */
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
    if (_redis.status === 'ready') {
      await _redis.quit().catch((err: unknown) => {
        logger.warn({ err }, 'Redis quit failed — forcing disconnect');
        _redis?.disconnect();
      });
    } else {
      // Not connected (down, or still retrying forever): QUIT would sit in the
      // offline queue and never be answered, so cut the client loose directly.
      _redis.disconnect();
    }
    _redis = null;
    logger.info('Redis disconnected');
  }
};
