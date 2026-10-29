import { getRedis } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { REDIS_KEYS } from './keys.js';
import type { AnonSession, VibeTag } from '../../types/match.js';

/**
 * Anonymous aggregate counters for the admin Whisper page.
 *
 * One Redis hash per UTC day, `wstats:YYYY-MM-DD`, holding bare numbers like
 * `gender:female`. NEVER an anonId, name, message or per-session row, so nothing
 * here can be traced to a chat ("chats aren't stored" still holds). Keys expire
 * after 90 days. Every write is fire-and-forget: stats must never slow or fail a chat.
 *
 * ponytail: Redis-only, so a Redis wipe loses history. Upgrade: daily rollup to Mongo.
 */
const KEEP_DAYS = 90;
const dayKey = (d = new Date()): string => `wstats:${d.toISOString().slice(0, 10)}`;

export const bumpWhisperStats = (fields: Record<string, number>): void => {
  const key = dayKey();
  const pipe = getRedis().pipeline();
  for (const [f, n] of Object.entries(fields)) pipe.hincrby(key, f, n);
  pipe.expire(key, KEEP_DAYS * 86_400);
  void pipe.exec().catch((err: unknown) => logger.warn({ err }, 'Whisper stats write failed'));
};

/**
 * Count a distinct person per day with a HyperLogLog. It answers "how many different
 * people" but cannot list them: the ids are hashed in and never stored.
 */
export const trackUnique = (kind: string, id: string): void => {
  const key = `wstats:u:${kind}:${new Date().toISOString().slice(0, 10)}`;
  const pipe = getRedis().pipeline();
  pipe.pfadd(key, id);
  pipe.expire(key, KEEP_DAYS * 86_400);
  void pipe.exec().catch((err: unknown) => logger.warn({ err }, 'Whisper unique write failed'));
};

export const UNIQUE_KINDS = ['anon_user', 'anon_guest', 'rooms_member', 'rooms_guest'] as const;

export const trackJoin = (gender: string, tags: VibeTag[], signedIn: boolean): void => {
  const f: Record<string, number> = {
    joined: 1,
    [signedIn ? 'joined_user' : 'joined_guest']: 1,
    [`gender:${gender}`]: 1,
    [`tagcount:${Math.min(tags.length, 3)}`]: 1,
  };
  for (const t of tags) f[`tag:${t.slice(0, 24)}`] = 1;
  bumpWhisperStats(f);
};

export const trackMatch = (): void =>
  bumpWhisperStats({ matched: 1, [`hour:${new Date().getUTCHours()}`]: 1 });

/** Called as a session ends, BEFORE its counters are deleted. */
export const trackSessionEnd = (session: AnonSession, c1: number, c2: number): void => {
  const ms = Date.now() - session.createdAt;
  bumpWhisperStats({
    ended: 1,
    dur_ms: ms,
    msgs: c1 + c2,
    ...(c1 > 0 && c2 > 0 ? { conversed: 1 } : {}),
    ...(ms < 30_000 ? { short: 1 } : {}),
  });
};

export const trackBlocked = (reason: string, severe: boolean): void =>
  bumpWhisperStats({ blocked: 1, [`blocked:${reason}`]: 1, ...(severe ? { auto_report: 1 } : {}) });

export type WhisperDay = { date: string; counters: Record<string, number> };

export type WhisperStats = {
  live: { queue: number; chats: number };
  days: WhisperDay[];
  /** Distinct people over the last 1, 7 and 30 days, per kind. */
  uniques: Record<string, { d1: number; d7: number; d30: number }>;
};

/** Live numbers plus the last `days` days (oldest first). */
export const getWhisperStats = async (days: number): Promise<WhisperStats> => {
  const redis = getRedis();
  const dates = Array.from({ length: days }, (_, i) =>
    new Date(Date.now() - (days - 1 - i) * 86_400_000)
  );
  const pipe = redis.pipeline();
  for (const d of dates) pipe.hgetall(dayKey(d));
  const rows = await pipe.exec();

  // Active chats = active pointers / 2. SCAN returns keys WITH the prefix, so match with it.
  const prefix = env.REDIS_KEY_PREFIX;
  let cursor = '0';
  let pointers = 0;
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', `${prefix}match:active:*`, 'COUNT', 500);
    cursor = next;
    pointers += keys.length;
  } while (cursor !== '0');

  const uniques: WhisperStats['uniques'] = {};
  for (const kind of UNIQUE_KINDS) {
    const keys = (n: number) =>
      Array.from({ length: n }, (_, i) => `wstats:u:${kind}:${new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10)}`);
    const [d1, d7, d30] = await Promise.all([1, 7, 30].map((n) => redis.pfcount(...keys(n))));
    uniques[kind] = { d1, d7, d30 };
  }

  return {
    uniques,
    live: { queue: await redis.llen(REDIS_KEYS.queue), chats: Math.floor(pointers / 2) },
    days: dates.map((d, i) => ({
      date: d.toISOString().slice(0, 10),
      counters: Object.fromEntries(
        Object.entries((rows?.[i]?.[1] ?? {}) as Record<string, string>).map(([k, v]) => [k, Number(v)])
      ),
    })),
  };
};
