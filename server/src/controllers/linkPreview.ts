import type { RequestHandler } from 'express';
import type { ValidatedRequest } from '../middlewares/validate.js';
import { linkPreviewService } from '../services/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import type { LinkPreviewQuery } from '../validators/linkPreview.js';

export const getLinkPreview: RequestHandler = catchAsync(async (req, res) => {
  const { url } = (req as ValidatedRequest<LinkPreviewQuery>).validatedQuery;
  const data = await linkPreviewService.getLinkPreview(url);
  res.status(200).json({ success: true, data });
});
