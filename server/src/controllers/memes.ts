import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { getMemeFeed } from '../services/memes/feed.js';
import * as memeSaveRepo from '../repositories/memeSave.js';
import * as userRepo from '../repositories/user.js';
import type { ValidatedRequest } from '../middlewares/validate.js';
import type { MemesQuery } from '../types/input.js';

/**
 * GET /api/memes?cat=&page=
 *
 * Public shuffle feed — guests and members alike. Thin proxy with a short
 * server cache so many guests don't each burn provider quota. A provider
 * failure serves stale cache when there is any, else 503 (never an empty
 * 200 that looks like "no jokes exist").
 *
 * Members with the stored 18+ opt-in pour unfiltered; everyone else —
 * guests, new members, opt-outs — pours blacklist-filtered. The mode comes
 * from the user record, never the query string.
 */
export const listMemesController: RequestHandler = catchAsync(async (req, res) => {
  const { cat, page, exclude } = (req as ValidatedRequest<MemesQuery>).validatedQuery;
  const unfiltered = req.userId ? await userRepo.getMemeUnfiltered(req.userId) : false;
  try {
    const feed = await getMemeFeed({ category: cat, page, exclude, unfiltered });
    res.status(200).json({ success: true, data: feed });
  } catch {
    throw new AppError(503, 'The joke tap is dry right now — pull to retry in a bit');
  }
});

/** GET /api/memes/mode — this member's unfiltered opt-in. Members only. */
export const getMemeModeController: RequestHandler = catchAsync(async (req, res) => {
  const unfiltered = await userRepo.getMemeUnfiltered(req.userId!);
  res.status(200).json({ success: true, data: { unfiltered } });
});

/**
 * POST /api/memes/mode — flip the unfiltered opt-in. Enabling requires the
 * 18+ self-declaration in the same call (enforced by `memeModeSchema`);
 * disabling is unconditional.
 */
export const setMemeModeController: RequestHandler = catchAsync(async (req, res) => {
  const { unfiltered } = req.body as { unfiltered: boolean };
  await userRepo.setMemeUnfiltered(req.userId!, unfiltered);
  res.status(200).json({ success: true, data: { unfiltered } });
});

/**
 * Saved ids for sync (members only). The client unions these into local
 * state — additive, so no conflict is possible and no opt-in dance needed.
 */
export const listSavesController: RequestHandler = catchAsync(async (req, res) => {
  const ids = await memeSaveRepo.listSavedIds(req.userId!, 'jokeapi');
  res.status(200).json({ success: true, data: { ids } });
});

/** Save one joke (members only). Idempotent — re-saving is a no-op. */
export const saveMemeController: RequestHandler = catchAsync(async (req, res) => {
  const { source, externalId } = req.body as { source: string; externalId: number };
  await memeSaveRepo.save({ userId: req.userId!, source, externalId });
  res.status(200).json({ success: true, data: { saved: true } });
});

/** Unsave one joke (members only). Missing is fine — the intent holds. */
export const unsaveMemeController: RequestHandler = catchAsync(async (req, res) => {
  const { source, externalId } = req.params as { source: string; externalId: string };
  await memeSaveRepo.unsave({ userId: req.userId!, source, externalId: Number(externalId) });
  res.status(200).json({ success: true, data: { saved: false } });
});
