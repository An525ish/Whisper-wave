import { Router } from 'express';
import { getLinkPreview } from '../controllers/linkPreview.js';
import { auth, searchLimiter, validate } from '../middlewares/index.js';
import { linkPreviewQuerySchema } from '../validators/linkPreview.js';

export const linkPreviewRouter = Router();

linkPreviewRouter.use(auth);
linkPreviewRouter.get(
  '/',
  searchLimiter,
  validate(linkPreviewQuerySchema, 'query'),
  getLinkPreview,
);
