import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import type { JokeItem, MemeCategory } from '../../types/meme.js';

/**
 * JokeAPI adapter — fetches, validates and normalizes third-party jokes.
 *
 * Content posture (D6, amended): guests and default members get the
 * programming/misc/pun shelves with every blacklist flag on (`nsfw,
 * religious,political,racist,sexist,explicit`), English only, never `Any`.
 * The Dark shelf and the flag-free feed exist only for members with the
 * stored 18+ opt-in (`unfiltered`, decided by the feed layer, never the query
 * string). Per-joke safety nets remain either way: the persistent blocklist,
 * client hide, and the report flow. Third-party JSON is size-capped and
 * Zod-validated entry by entry — one bad joke never costs the batch, and
 * nothing unvalidated reaches a client.
 *
 * No key, no registration: 120 req/min, which the feed cache (see `feed.ts`)
 * keeps us far under. One operational quirk from their docs: Cloudflare 403s
 * headerless server clients, so every request carries an explicit User-Agent.
 */

const JOKEAPI_BASE = 'https://v2.jokeapi.dev';
const USER_AGENT = 'WhisperWave/1.0 (meme feed proxy; contact: safety@whisperwave.app)';
const MAX_JOKES_PER_CALL = 10;
const MAX_LINE_CHARS = 180;
const MAX_JOKE_TEXT = 500;
const FETCH_TIMEOUT_MS = 4000;
const MAX_BODY_BYTES = 256 * 1024;
/** One retry, only for timeouts/network errors/5xx — never for 4xx or 429. */
const RETRY_BASE_MS = 150;
const RETRY_JITTER_MS = 250;
/** JokeAPI error code for "no matching joke" (range past the category's max id). */
const NO_MATCH_CODE = 106;
const BLACKLIST_FLAGS = ['nsfw', 'religious', 'political', 'racist', 'sexist', 'explicit'] as const;

const CATEGORY_PARAM: Record<MemeCategory, string> = {
  programming: 'Programming',
  misc: 'Misc',
  pun: 'Pun',
  dark: 'Dark',
};

/** Categories the provider can legitimately return for our requests. */
const PROVIDER_CATEGORIES = ['Misc', 'Programming', 'Dark', 'Pun', 'Spooky', 'Christmas'] as const;

const text = z.string().min(1).max(MAX_JOKE_TEXT);
const baseJoke = {
  id: z.number().int().nonnegative(),
  category: z.enum(PROVIDER_CATEGORIES),
  flags: z.record(z.string(), z.boolean()).optional(),
};
const jokeSchema = z.union([
  z.object({ ...baseJoke, type: z.literal('single'), joke: text }),
  z.object({ ...baseJoke, type: z.literal('twopart'), setup: text, delivery: text }),
]);
type ProviderJoke = z.infer<typeof jokeSchema>;

const batchSchema = z.object({
  error: z.literal(false),
  jokes: z.array(z.unknown()).max(MAX_JOKES_PER_CALL),
});

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

/** Any other provider failure — the feed serves stale cache or 503, never random. */
export class ProviderError extends Error {
  constructor(
    message: string,
    /** False for failures a second try cannot fix (oversized body). */
    readonly retryable = true
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

/** Templates verified against the Memegen docs — unknown slugs 404. */
const TEMPLATES = ['buzz', 'drake', 'fry', 'blb', 'iw', 'pigeon'] as const;

/** Memegen's documented single-character escapes (space is `_`, newline is flattened first). */
const MEMEGEN_ESCAPES: Record<string, string> = {
  _: '__',
  '-': '--',
  ' ': '_',
  '~': '~~',
  '?': '~q',
  '&': '~a',
  '%': '~p',
  '#': '~h',
  '/': '~s',
  '\\': '~b',
  '<': '~l',
  '>': '~g',
  '"': "''",
};

/**
 * Memegen path escaping (https://memegen.link/#custom-text), one pass per
 * code point so escapes never re-escape each other. Everything else goes
 * through `encodeURIComponent` (non-ASCII, `;`, backtick, …); its unreserved
 * set already covers `~ _ - '`. Control chars and lone surrogates (which would
 * throw in `encodeURIComponent`) are dropped; truncation counts code points.
 * A segment that is only dots would be a path traversal — it becomes `_`.
 */
export const slugifyMemeText = (input: string): string => {
  const clean = input
    .replace(/[\p{Cc}\p{Cs}]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const slug = Array.from(clean)
    .slice(0, MAX_LINE_CHARS)
    .map((ch) => MEMEGEN_ESCAPES[ch] ?? encodeURIComponent(ch))
    .join('');
  return /^\.*$/.test(slug) ? '_' : slug;
};

/** Deterministic template per joke id — variety without coordination. */
export const templateFor = (id: number): string =>
  TEMPLATES[Math.abs(id) % TEMPLATES.length] ?? TEMPLATES[0] ?? 'buzz';

/** Ready image URL for one normalized joke. Empty bottom line for singles. */
export const memeImageUrl = (joke: { id: number; setup: string; delivery?: string }): string => {
  const top = slugifyMemeText(joke.setup);
  const bottom = joke.delivery ? slugifyMemeText(joke.delivery) : '_';
  return `https://api.memegen.link/images/${templateFor(joke.id)}/${top}/${bottom}.jpg?width=600`;
};

export const normalizeJoke = (joke: ProviderJoke): JokeItem => {
  const setup = joke.type === 'single' ? joke.joke : joke.setup;
  const delivery = joke.type === 'twopart' ? joke.delivery : undefined;
  return {
    id: joke.id,
    category: joke.category,
    setup,
    ...(delivery ? { delivery } : {}),
    imageUrl: memeImageUrl({ id: joke.id, setup, ...(delivery ? { delivery } : {}) }),
  };
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

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** Read the body as text, refusing anything past `MAX_BODY_BYTES`. */
const readCappedText = async (res: Response): Promise<string> => {
  const declared = Number(res.headers.get('content-length') ?? 0);
  if (declared > MAX_BODY_BYTES) throw new ProviderError('JokeAPI response too large', false);
  const reader = res.body?.getReader();
  if (!reader) return '';
  const decoder = new TextDecoder();
  let received = 0;
  let out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BODY_BYTES) {
      await reader.cancel().catch((err: unknown) => logger.debug({ err }, 'JokeAPI body cancel failed'));
      throw new ProviderError('JokeAPI response too large', false);
    }
    out += decoder.decode(value, { stream: true });
  }
  return out + decoder.decode();
};

type RawAnswer = { status: number; body: unknown };

/** One HTTP attempt: timeout-bound, size-capped. Throws `ProviderError` on transport trouble. */
const attempt = async (url: string): Promise<RawAnswer> => {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    const raw = await readCappedText(res);
    let body: unknown = null;
    try {
      body = JSON.parse(raw);
    } catch (err) {
      logger.debug({ err, status: res.status }, 'JokeAPI body was not JSON');
    }
    return { status: res.status, body };
  } catch (err) {
    if (err instanceof ProviderError) throw err;
    throw new ProviderError(`JokeAPI unreachable: ${err instanceof Error ? err.message : 'unknown'}`);
  }
};

/** Attempt, plus one jittered retry for transport errors and 5xx. */
const requestOnce = async (url: string): Promise<RawAnswer> => {
  try {
    const answer = await attempt(url);
    if (answer.status < 500) return answer;
    logger.debug({ status: answer.status }, 'JokeAPI 5xx, retrying once');
  } catch (err) {
    if (!(err instanceof ProviderError) || !err.retryable) throw err;
    logger.debug({ err }, 'JokeAPI transport error, retrying once');
  }
  await sleep(RETRY_BASE_MS + Math.random() * RETRY_JITTER_MS);
  return attempt(url);
};

const isBlacklisted = (joke: ProviderJoke): boolean =>
  BLACKLIST_FLAGS.some((flag) => joke.flags?.[flag] === true);

/**
 * Fetch one batch from JokeAPI. Throws on provider failure — the feed layer
 * decides between stale cache and 503, this function only fetches honestly:
 * `JokeRangeEmptyError` for the provider's 106 "no match", `ProviderError`
 * for everything else.
 */
export const fetchJokes = async (input: FetchJokesInput): Promise<JokeItem[]> => {
  const params = new URLSearchParams({
    lang: 'en',
    type: 'single,twopart',
    amount: String(MAX_JOKES_PER_CALL),
  });
  if (!input.unfiltered) params.set('blacklistFlags', BLACKLIST_FLAGS.join(','));
  if (input.idRange) params.set('idRange', input.idRange);

  const url = `${JOKEAPI_BASE}/joke/${CATEGORY_PARAM[input.category]}?${params.toString()}`;
  const { status, body } = await requestOnce(url);
  if (status === 429) throw new ProviderError('JokeAPI rate limited (429)');

  // A range past the category's max id answers 400 *with* a 106 body — read
  // the body before the status, so a range miss parses as empty, not outage.
  const failure = providerErrorSchema.safeParse(body);
  if (failure.success) {
    if (failure.data.code === NO_MATCH_CODE) throw new JokeRangeEmptyError();
    throw new ProviderError(`JokeAPI error ${failure.data.code ?? 'unknown'}`);
  }
  if (status < 200 || status >= 300) throw new ProviderError(`JokeAPI answered ${status}`);

  const batch = batchSchema.safeParse(body);
  if (!batch.success) {
    logger.warn({ category: input.category }, 'JokeAPI answered outside its contract');
    throw new ProviderError('JokeAPI answered outside its contract');
  }

  const out: JokeItem[] = [];
  for (const entry of batch.data.jokes) {
    const parsed = jokeSchema.safeParse(entry);
    if (!parsed.success) {
      logger.debug({ category: input.category }, 'Dropped an invalid JokeAPI entry');
      continue;
    }
    // Belt and braces: filtered mode never serves a flagged joke even if the
    // provider ignored `blacklistFlags`.
    if (!input.unfiltered && isBlacklisted(parsed.data)) continue;
    out.push(normalizeJoke(parsed.data));
  }
  return out;
};
