import type { RequestHandler } from 'express';
import { catchAsync } from '../../utils/catchAsync.js';
import { deleteAnonImages, listAnonImages } from '../../services/admin/anonImages.js';

export const listAnonImagesController: RequestHandler = catchAsync(async (req, res) => {
  const { limit, before } = (req as typeof req & { validatedQuery: { limit: number; before?: string } })
    .validatedQuery;
  res.json({ success: true, ...(await listAnonImages(limit, before)) });
});

export const deleteAnonImagesController: RequestHandler = catchAsync(async (req, res) => {
  await deleteAnonImages((req.body as { ids: string[] }).ids);
  res.json({ success: true });
});
