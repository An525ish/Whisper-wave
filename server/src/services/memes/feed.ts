import { logger } from '../../utils/logger.js';
import type { JokeItem, MemeCategory, MemeFeedPage, MemeFeedSelector } from '../../types/meme.js';
import { isJokeBlocked } from './blocklist.js';
import { fetchJokes, JokeRangeEmptyError } from './jokeapi.js';

/**
 * The memes feed: ranged pages cached per category/page and blocklist-
 * filtered, with stale fallback when the provider fails.
 *
 * Pagination is id ranges (JokeAPI has no cursor): page N reads ids
 * N*100–N*100+99. Provider ids are global across categories and each
 * category tops out far below the global pool (Misc ends near id 318), so
 * past a category's max id the provider answers 106 ("no matching joke")
 * instead of an empty list — a range miss pours random instead of ending
 * the tap early. Random draws take the caller's `exclude` set and
 * over-fetch to fill the page, so the client's end-of-list means the pool
 * is genuinely dry, never a mid-pool stall on recycled duplicates.
 */
const CACHE_TTL_MS = 45_000;
const RANGE_SIZE = 100;
const RANGE_PAGES = 14;
/** Jokes per feed page — matches the provider's max batch. */
const FEED_PAGE_SIZE = 10;
/** Random top-up attempts per page before admitting the pool is dry. */
const RANDOM_ATTEMPTS = 4;
/** Cap on caller-supplied seen ids (~3.5KB of query string). */
const MAX_EXCLUDE = 500;

type CacheEntry = { at: number; items: JokeItem[] };

const cache = new Map<string, CacheEntry>();

const rangeFor = (page: number): string | undefined => {
  if (page < 0 || page >= RANGE_PAGES) return undefined;
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

/**
 * Random draws minus seen/blocked/dupes, over-fetching to fill the page.
 * Returns short — or empty — only at true pool exhaustion, so the client's
 * end-of-list means "you've seen this whole shelf", never a mid-pool stall.
 */
const randomFill = async (
  category: MemeCategory,
  exclude: Set<number>,
  unfiltered: boolean
): Promise<JokeItem[]> => {
  const out: JokeItem[] = [];
  for (let attempt = 0; attempt < RANDOM_ATTEMPTS && out.length < FEED_PAGE_SIZE; attempt++) {
    const jokes = await fetchJokes({ category, unfiltered });
    for (const joke of jokes) {
      if (exclude.has(joke.id) || isJokeBlocked(joke.id)) continue;
      if (out.some((o) => o.id === joke.id)) continue;
      out.push(joke);
      if (out.length >= FEED_PAGE_SIZE) break;
    }
  }
  return out;
};

/** Rotation order for `mix` — general funny first, dark last in the cycle. */
const MIX_ROTATION: MemeCategory[] = ['misc', 'programming', 'pun', 'dark'];

/** Resolve the feed selector to one provider category (deterministic per page). */
const resolveCategory = (selector: MemeFeedSelector, page: number): MemeCategory =>
  selector === 'mix' ? (MIX_ROTATION[page % MIX_ROTATION.length] ?? 'misc') : selector;

export const getMemeFeed = async (params: {
  category: MemeFeedSelector;
  page: number;
  exclude?: string;
  /** Stored 18+ opt-in only — never a client toggle. Filtered by default. */
  unfiltered?: boolean;
}): Promise<MemeFeedPage> => {
  const unfiltered = params.unfiltered === true;
  // Filtered and unfiltered streams must never share cache entries.
  const key = `${params.category}:${params.page}:${unfiltered ? 'raw' : 'safe'}`;
  const now = Date.now();
  // `mix` rotates shelves per page but stays deterministic, so the shared
  // page cache remains consistent across callers.
  const providerCategory = resolveCategory(params.category, params.page);

  const fresh = cache.get(key);
  if (fresh && now - fresh.at < CACHE_TTL_MS) {
    // Filter on read, not just on fetch: an admin block lands immediately,
    // not when the cache entry happens to expire.
    return { items: fresh.items.filter((j) => !isJokeBlocked(j.id)), page: params.page };
  }

  try {
    const range = rangeFor(params.page);
    if (range !== undefined) {
      try {
        const jokes = await fetchJokes({ category: providerCategory, idRange: range, unfiltered });
        const items = jokes.filter((j) => !isJokeBlocked(j.id));
        if (items.length > 0) {
          // Ranged pages are positional and shared — cached, and never
          // narrowed by one caller's seen set (the client dedupes anyway).
          cache.set(key, { at: now, items });
          return { items, page: params.page };
        }
      } catch (err) {
        // Past a category's max id the provider answers 106 ("no matching
        // joke") instead of an empty list. That is a range miss, not an
        // outage — fall through to random below. Anything else rethrows to
        // the stale-cache/503 path.
        if (!(err instanceof JokeRangeEmptyError)) throw err;
        logger.debug({ ...params }, 'Meme id range missed, pouring random');
      }
    }
    // Random path: per-caller by construction (each caller brings its own
    // seen set), so never page-cached — and never an empty 200 that looks
    // like "no jokes exist" until the pool is genuinely dry.
    const items = await randomFill(providerCategory, parseExclude(params.exclude ?? ''), unfiltered);
    return { items, page: params.page };
  } catch (err) {
    logger.warn({ err, ...params }, 'Meme feed provider failed');
    if (fresh) return { items: fresh.items, page: params.page, stale: true };
    throw err;
  }
};
