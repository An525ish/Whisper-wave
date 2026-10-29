import { z } from 'zod';
import { MEME_RANGE_PAGES } from '../constants/memes.js';

/**
 * `GET /api/memes?cat=&page=&exclude=` — page maps to a provider id range.
 * `mix` (the default) rotates programming/misc/pun per page, so the feed is
 * one pure scroll with no category picking on either end. `dark` is accepted
 * here but the service refuses it unless the member has the unfiltered
 * opt-in. `page` stops at the first random-only page — the provider pool is
 * finite, and an unbounded page just widens the cache-key surface.
 */
export const memesQuerySchema = z.object({
  cat: z.enum(['programming', 'misc', 'pun', 'dark', 'mix']).default('mix'),
  page: z.coerce.number().int().min(0).max(MEME_RANGE_PAGES).default(0),
  /** Already-seen provider ids — the random fallback pours around them. */
  exclude: z.string().max(3500).regex(/^[\d,]*$/).default(''),
});

/** Admin blocklist: provider joke ids only, never free text. */
export const memeBlockSchema = z.object({
  id: z.number().int().nonnegative(),
});
export const memeBlockParamsSchema = z.object({
  id: z.coerce.number().int().nonnegative(),
});

/** `POST /api/memes/report` — guests allowed; the reporter is the request's gid. */
export const memeReportSchema = z.object({
  externalId: z.number().int().nonnegative(),
  source: z.literal('jokeapi'),
  reason: z.enum(['offensive', 'sexual', 'hateful', 'broken', 'other']),
});

/** Member save sync — today only the jokeapi source exists. */
export const memeSaveSchema = z.object({
  source: z.literal('jokeapi'),
  externalId: z.number().int().nonnegative(),
});
export const memeSaveParamsSchema = z.object({
  source: z.literal('jokeapi'),
  externalId: z.coerce.number().int().nonnegative(),
});

/**
 * `POST /api/memes/mode` — flip the unfiltered opt-in. Enabling requires an
 * explicit 18+ self-declaration in the same call; disabling needs nothing.
 * Guests never reach here (`auth`), and the feed never trusts a query param.
 */
export const memeModeSchema = z
  .object({
    unfiltered: z.boolean(),
    confirmAdult: z.boolean().optional(),
  })
  .refine((v) => !v.unfiltered || v.confirmAdult === true, {
    message: 'Enabling the unfiltered feed requires confirming you are 18 or older',
    path: ['confirmAdult'],
  });
