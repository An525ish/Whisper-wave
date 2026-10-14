import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import { MEME_RANGE_PAGES } from '../../constants/memes.js';
import type { JokeItem, MemeCategory, MemeFeedPage, MemeFeedSelector } from '../../types/meme.js';
import { ensureBlocklist, isJokeBlocked } from './blocklist.js';
import { fetchJokes, JokeRangeEmptyError } from './jokeapi.js';

/**
 * The memes feed: ranged pages cached per category/page/mode and blocklist-
 * filtered, with stale fallback when the provider fails.
 *
 * Shelves (D6, amended): guests and default members get programming/misc/pun
 * (blacklist flags on). `dark` — selectable or in the `mix` rotation — exists
 * only for members whose stored unfiltered opt-in is on; anyone else asking
 * for it gets a 403. Filtered and unfiltered streams never share cache.
 *
 * Pagination is id ranges (JokeAPI has no cursor): page N reads ids
 * N*100–N*100+99. Provider ids are global across categories and each
 * category tops out far below the global pool (Misc ends near id 318), so
 * past a category's max id the provider answers 106 ("no matching joke")
 * instead of an empty list — a range miss pours random instead of ending
 * the tap early. Random draws come from a short per-(shelf, mode) pool that
 * concurrent callers share (so one request is rarely more than one upstream
 * call), minus the caller's `exclude` set; the client's end-of-list means the
 * pool is genuinely dry, never a mid-pool stall on recycled duplicates.
 * Concurrent identical misses are single-flighted.
 */
const CACHE_TTL_MS = 45_000;
const MAX_CACHE_ENTRIES = 128;
const RANGE_SIZE = 100;
/** Jokes per feed page — matches the provider's max batch. */
const FEED_PAGE_SIZE = 10;
/** Pool refills per random page before admitting the pool is dry. */
const RANDOM_ATTEMPTS = 4;
const POOL_TTL_MS = 30_000;
const POOL_MAX_JOKES = 60;
/** Cap on caller-supplied seen ids (~3.5KB of query string). */
const MAX_EXCLUDE = 500;

const SAFE_ROTATION: MemeCategory[] = ['misc', 'programming', 'pun'];
const UNFILTERED_ROTATION: MemeCategory[] = [...SAFE_ROTATION, 'dark'];

type CacheEntry = { at: number; items: JokeItem[] };
type Pool = { at: number; jokes: Map<number, JokeItem> };

/** LRU-ish: reads and writes move an entry to the tail; the head is evicted. */
const cache = new Map<string, CacheEntry>();
const pools = new Map<string, Pool>();
const rangeFlights = new Map<string, Promise<JokeItem[]>>();
const poolFlights = new Map<string, Promise<number>>();

const singleFlight = <T>(flights: Map<string, Promise<T>>, key: string, run: () => Promise<T>): Promise<T> => {
  const running = flights.get(key);
  if (running) return running;
  const started = run().finally(() => flights.delete(key));
  flights.set(key, started);
  return started;
};

const remember = (key: string, entry: CacheEntry): void => {
  cache.delete(key);
  cache.set(key, entry);
  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
};

const rangeFor = (page: number): string | undefined => {
  if (page < 0 || page >= MEME_RANGE_PAGES) return undefined;
  const start = page * RANGE_SIZE;
  return `${start}-${start + RANGE_SIZE - 1}`;
};

const parseExclude = (raw: string): Set<number> => {
  if (!raw) return new Set();
  const ids = raw
    .split(',')
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0)
    .slice(0, MAX_EXCLUDE);
  return new Set(ids);
};

const notBlocked = (items: JokeItem[]): JokeItem[] => items.filter((j) => !isJokeBlocked(j.id));

const shuffled = <T>(items: T[]): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
};

const livePool = (key: string, now: number): Pool | undefined => {
  const pool = pools.get(key);
  return pool && now - pool.at < POOL_TTL_MS ? pool : undefined;
};

/** One upstream call, merged into the shelf's pool. Resolves to how many ids were new. */
const refillPool = (key: string, category: MemeCategory, unfiltered: boolean): Promise<number> =>
  singleFlight(poolFlights, key, async () => {
    let jokes: JokeItem[];
    try {
      jokes = await fetchJokes({ category, unfiltered });
    } catch (err) {
      if (err instanceof JokeRangeEmptyError) return 0; // pool genuinely dry
      throw err;
    }
    const now = Date.now();
    let pool = livePool(key, now);
    if (!pool) {
      pool = { at: now, jokes: new Map() };
      pools.set(key, pool);
    }
    let added = 0;
    for (const joke of jokes) {
      if (pool.jokes.size >= POOL_MAX_JOKES) break;
      if (pool.jokes.has(joke.id)) continue;
      pool.jokes.set(joke.id, joke);
      added += 1;
    }
    return added;
  });

/**
 * Random page from the shelf pool minus seen/blocked, refilling (one call at
 * a time, stopping at the first batch with nothing new) until a page fills.
 * Short — or empty — only at true pool exhaustion.
 */
const randomFill = async (
  category: MemeCategory,
  exclude: Set<number>,
  unfiltered: boolean
): Promise<JokeItem[]> => {
  const key = `${category}:${unfiltered ? 'raw' : 'safe'}`;
  const candidates = (): JokeItem[] =>
    notBlocked([...(livePool(key, Date.now())?.jokes.values() ?? [])]).filter((j) => !exclude.has(j.id));
  for (let attempt = 0; attempt < RANDOM_ATTEMPTS && candidates().length < FEED_PAGE_SIZE; attempt++) {
    if ((await refillPool(key, category, unfiltered)) === 0) break;
  }
  return shuffled(candidates()).slice(0, FEED_PAGE_SIZE);
};

/** Resolve the feed selector to one provider shelf (deterministic per page). */
const resolveCategory = (selector: MemeFeedSelector, page: number, unfiltered: boolean): MemeCategory => {
  if (selector !== 'mix') return selector;
  const rotation = unfiltered ? UNFILTERED_ROTATION : SAFE_ROTATION;
  return rotation[page % rotation.length] ?? 'misc';
};

/** Ranged page fetch; a provider range miss resolves to `[]` (caller pours random). */
const loadRange = (
  key: string,
  category: MemeCategory,
  range: string,
  unfiltered: boolean
): Promise<JokeItem[]> =>
  singleFlight(rangeFlights, key, async () => {
    try {
      const jokes = await fetchJokes({ category, idRange: range, unfiltered });
      // Cached unfiltered by the blocklist — it is applied on every read, so
      // an admin block lands immediately, not when the entry expires.
      if (jokes.length > 0) remember(key, { at: Date.now(), items: jokes });
      return jokes;
    } catch (err) {
      if (err instanceof JokeRangeEmptyError) return [];
      throw err;
    }
  });

export const getMemeFeed = async (params: {
  category: MemeFeedSelector;
  page: number;
  exclude?: string;
  /** Stored 18+ opt-in only — never a client toggle. Filtered by default. */
  unfiltered?: boolean;
}): Promise<MemeFeedPage> => {
  const unfiltered = params.unfiltered === true;
  if (params.category === 'dark' && !unfiltered) {
    throw new AppError(403, 'The Dark shelf is only available with the unfiltered 18+ mode');
  }
  const page = Math.min(Math.max(params.page, 0), MEME_RANGE_PAGES);
  await ensureBlocklist();

  // Filtered and unfiltered streams must never share cache entries.
  const key = `${params.category}:${page}:${unfiltered ? 'raw' : 'safe'}`;
  // `mix` rotates shelves per page but stays deterministic, so the shared
  // page cache remains consistent across callers.
  const providerCategory = resolveCategory(params.category, page, unfiltered);

  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    remember(key, cached);
    return { items: notBlocked(cached.items), page };
  }

  try {
    const range = rangeFor(page);
    if (range !== undefined) {
      const items = notBlocked(await loadRange(key, providerCategory, range, unfiltered));
      // Ranged pages are positional and shared — never narrowed by one
      // caller's seen set (the client dedupes anyway).
      if (items.length > 0) return { items, page };
      logger.debug({ key }, 'Meme id range empty, pouring random');
    }
    // Random path: per-caller by construction (each caller brings its own
    // seen set) and never an empty 200 that looks like "no jokes exist"
    // until the pool is genuinely dry.
    const items = await randomFill(providerCategory, parseExclude(params.exclude ?? ''), unfiltered);
    return { items, page };
  } catch (err) {
    logger.warn({ err, key }, 'Meme feed provider failed');
    // Stale beats a 503 — but the blocklist still applies to it.
    if (cached) return { items: notBlocked(cached.items), page, stale: true };
    throw err;
  }
};
