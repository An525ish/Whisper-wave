import type { RequestHandler } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { readWordFilter, saveWordFilter } from '../../services/moderation/wordFilter.js';
import type { WordFilterConfig } from '../../services/match/moderation.js';

/** GET /api/admin/moderation/words — the live blocked-word settings. Admin only. */
export const getWordFilterController: RequestHandler = catchAsync(async (_req, res) => {
  res.json({ success: true, data: readWordFilter() });
});

/** PUT /api/admin/moderation/words — replace the settings (master switch, per-category switch and terms). */
export const putWordFilterController: RequestHandler = catchAsync(async (req, res) => {
  res.json({ success: true, data: await saveWordFilter(req.body as WordFilterConfig) });
});
