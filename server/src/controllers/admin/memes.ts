import type { RequestHandler } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { blockJokeId, listBlocklist, unblockJokeId } from '../../services/memes/blocklist.js';

/**
 * GET /api/admin/memes/blocklist — `{ ids, items }`: `ids` are the blocked
 * provider ids; `items` is every tracked row (`{ id, reports, blocked,
 * reason?, updatedAt }`), blocked first then most-reported. Admin only.
 */
export const listBlockedController: RequestHandler = catchAsync(async (_req, res) => {
  res.status(200).json({ success: true, data: await listBlocklist() });
});

/** POST /api/admin/memes/blocklist — hide one provider joke everywhere. Admin only. */
export const blockJokeController: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.body as { id: number };
  await blockJokeId(id, 'admin');
  res.status(200).json({ success: true, data: await listBlocklist() });
});

/** DELETE /api/admin/memes/blocklist/:id — un-hide and reset reports. Admin only. */
export const unblockJokeController: RequestHandler = catchAsync(async (req, res) => {
  // `memeBlockParamsSchema` already coerced the id to a number.
  const { id } = req.params as unknown as { id: number };
  const lifted = await unblockJokeId(id);
  if (!lifted) {
    res.status(404).json({ success: false, message: 'Joke id not blocked' });
    return;
  }
  res.status(200).json({ success: true, data: await listBlocklist() });
});
