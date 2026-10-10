import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import type { JokeItem, MemeCategory } from '../../types/meme.js';

/**
 * JokeAPI adapter — fetches, validates and normalizes third-party jokes.
 *
 * Content posture (deliberate, owner's call): the Dark shelf is in, and the
 * redundant `safe-mode` is off — but every blacklist flag stays on, English
 * only, and never `Any`. That keeps racist/sexist/explicit/religious/
 * political-flagged jokes out of a feed that serves guests with no age gate,
 * while death-and-misery humor without those flags pours. Per-joke safety
 * nets remain: the admin blocklist, client hide, and the report-abuse flow.
 * The response is Zod-validated because third-party JSON goes nowhere near
 * our clients uninspected.
 *
 * No key, no registration: 120 req/min, which the feed cache (see `feed.ts`)
 * keeps us far under. One operational quirk from their docs: Cloudflare 403s
 * headerless server clients, so every request carries an explicit User-Agent.
 */

const JOKEAPI_BASE = 'https://v2.jokeapi.dev';
const USER_AGENT = 'WhisperWave/1.0 (meme feed proxy; contact: safety@whisperwave.app)';
const MAX_JOKES_PER_CALL = 10;
const MAX_LINE_CHARS = 180;

export const MEME_CATEGORIES: MemeCategory[] = ['programming', 'misc', 'pun', 'dark'];

const CATEGORY_PARAM: Record<MemeCategory, string> = {
  programming: 'Programming',
  misc: 'Misc',
  pun: 'Pun',
  dark: 'Dark',
};

const jokeSchema = z.union([
  z.object({
    id: z.number(),
    category: z.string(),
    type: z.literal('single'),
    joke: z.string(),
  }),
  z.object({
    id: z.number(),
    category: z.string(),
    type: z.literal('twopart'),
    setup: z.string(),
    delivery: z.string(),
  }),
]);

const batchSchema = z.object({
  error: z.literal(false),
  amount: z.number(),
  jokes: z.array(jokeSchema),
});

/** Provider's "nothing matches" shape — e.g. an id range past the category's max id. */
const providerErrorSchema = z.object({
  error: z.literal(true),
  code: z.number().optional(),
  message: z.string().optional(),
});

/**
 * The provider found no joke for the filter (typically an id range past the
 * category's max id — Misc tops out near 318, far below the global pool).
 * An empty result, not an outage: callers fall back to random instead of 503.
 */
export class JokeRangeEmptyError extends Error {
  constructor() {
    super('JokeAPI found no matching joke for this range');
    this.name = 'JokeRangeEmptyError';
  }
}

/** Templates verified against the Memegen docs — unknown slugs 404. */
const TEMPLATES = ['buzz', 'drake', 'fry', 'blb', 'iw', 'pigeon'] as const;

/**
 * Memegen path escaping (https://memegen.link): underscores and dashes first
 * (they are the space encodings), then the tilde escapes, quotes dropped.
 */
export const slugifyMemeText = (text: string): string => {
  const trimmed = text.replace(/\s+/g, ' ').trim().slice(0, MAX_LINE_CHARS);
  return trimmed
    .replace(/_/g, '__')
    .replace(/-/g, '--')
    .replace(/ /g, '_')
    .replace(/\n/g, '~n')
    .replace(/\?/g, '~q')
    .replace(/&/g, '~a')
    .replace(/%/g, '~p')
    .replace(/#/g, '~h')
    .replace(/\//g, '~s')
    .replace(/\\/g, '~b')
    .replace(/</g, '~l')
    .replace(/>/g, '~g')
    .replace(/"/g, '')
    .replace(/'/g, '');
};

/** Deterministic template per joke id — variety without coordination. */
export const templateFor = (id: number): string =>
  TEMPLATES[Math.abs(id) % TEMPLATES.length] ?? TEMPLATES[0] ?? 'buzz';

/** Ready image URL for one normalized joke. Empty bottom line for singles. */
export const memeImageUrl = (joke: { id: number; setup: string; delivery?: string }): string => {
  const top = slugifyMemeText(joke.setup) || '_';
  const bottom = joke.delivery ? slugifyMemeText(joke.delivery) || '_' : '_';
  return `https://api.memegen.link/images/${templateFor(joke.id)}/${top}/${bottom}.jpg?width=600`;
};

export const normalizeJoke = (joke: z.infer<typeof jokeSchema>): JokeItem => {
  const setup = joke.type === 'single' ? joke.joke : joke.setup;
  const item: JokeItem = {
    id: joke.id,
    category: joke.category,
    setup,
    imageUrl: '',
  };
  if (joke.type === 'twopart') item.delivery = joke.delivery;
  item.imageUrl = memeImageUrl({ id: joke.id, setup, ...(item.delivery ? { delivery: item.delivery } : {}) });
  return item;
};

export type FetchJokesInput = {
  category: MemeCategory;
  /** Pagination via id ranges (JokeAPI has no cursor). Omit for random. */
  idRange?: string;
  /**
   * Opted-in adult feed: skip the blacklist flags. Only ever true for
   * members with the stored 18+ opt-in — the feed layer decides, never
   * the query string.
   */
  unfiltered?: boolean;
};

/**
 * Fetch one batch from JokeAPI. Throws on provider failure — the feed layer
 * decides between stale cache and 503, this function only fetches honestly.
 */
export const fetchJokes = async (input: FetchJokesInput): Promise<JokeItem[]> => {
  const params = new URLSearchParams({
    lang: 'en',
    type: 'single,twopart',
    amount: String(MAX_JOKES_PER_CALL),
  });
  if (!input.unfiltered) {
    params.set('blacklistFlags', 'nsfw,religious,political,racist,sexist,explicit');
  }
  if (input.idRange) params.set('idRange', input.idRange);

  const url = `${JOKEAPI_BASE}/joke/${CATEGORY_PARAM[input.category]}?${params.toString()}`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  } catch (err) {
    throw new Error(`JokeAPI unreachable: ${err instanceof Error ? err.message : 'unknown'}`);
  }
  if (res.status === 429) throw new Error('JokeAPI rate limited (429)');

  // A range past the category's max id answers 400 *with* a 106 body — read
  // the body before the status, so a range miss parses as empty, not outage.
  const body = await res.json().catch(() => null);
  if (providerErrorSchema.safeParse(body).success) {
    throw new JokeRangeEmptyError();
  }
  if (!res.ok) throw new Error(`JokeAPI answered ${res.status}`);

  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    logger.warn({ category: input.category }, 'JokeAPI answered outside its contract');
    throw new Error('JokeAPI answered outside its contract');
  }
  return parsed.data.jokes.map(normalizeJoke);
};
