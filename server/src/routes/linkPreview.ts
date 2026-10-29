import { Router } from 'express';
import { getLinkPreview } from '../controllers/linkPreview.js';
import { optionalAuth, searchLimiter, validate } from '../middlewares/index.js';
import { linkPreviewQuerySchema } from '../validators/linkPreview.js';

export const linkPreviewRouter = Router();

// Guests (anonymous chat) preview links too. The IP rate limit below and the
// public-address checks in the service are what keep this from being an open proxy.
linkPreviewRouter.use(optionalAuth);
linkPreviewRouter.get(
  '/',
  searchLimiter,
  validate(linkPreviewQuerySchema, 'query'),
  getLinkPreview,
);
