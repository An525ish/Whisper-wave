import type { RequestHandler } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { blockJokeId, listBlockedJokeIds, unblockJokeId } from '../../services/memes/blocklist.js';

/** GET /api/admin/memes/blocklist — every hidden provider id. Admin only. */
export const listBlockedController: RequestHandler = catchAsync(async (_req, res) => {
  res.status(200).json({ success: true, data: { ids: listBlockedJokeIds() } });
});

/** POST /api/admin/memes/blocklist — hide one provider joke everywhere. Admin only. */
export const blockJokeController: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.body as { id: number };
  blockJokeId(id);
  res.status(200).json({ success: true, data: { ids: listBlockedJokeIds() } });
});

/** DELETE /api/admin/memes/blocklist/:id — un-hide. Admin only. */
export const unblockJokeController: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params as { id: string };
  const lifted = unblockJokeId(Number(id));
  if (!lifted) {
    res.status(404).json({ success: false, message: 'Joke id not blocked' });
    return;
  }
  res.status(200).json({ success: true, data: { ids: listBlockedJokeIds() } });
});
