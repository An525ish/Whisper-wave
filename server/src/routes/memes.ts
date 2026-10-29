import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  getMemeModeController,
  listMemesController,
  listSavesController,
  reportMemeController,
  saveMemeController,
  setMemeModeController,
  unsaveMemeController,
} from '../controllers/memes.js';
import { auth, optionalAuth, validate } from '../middlewares/index.js';
import {
  memeModeSchema,
  memeReportSchema,
  memeSaveParamsSchema,
  memeSaveSchema,
  memesQuerySchema,
} from '../validators/memes.js';

export const memesRouter = Router();

/** Feed reads: 30 req / 60 s per IP — its own bucket, so GIF search and memes don't starve each other. */
const feedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many meme requests, please try again later' },
});

/** Joke reports: 10 req / 10 min per IP — own bucket, apart from the abuse-report form's. */
const memeReportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many reports submitted, please try again later' },
});

/**
 * Public shuffle feed. `optionalAuth` (not `auth`) so guests read freely and
 * the route stays forward-compatible with member-only features. The feed
 * limiter caps provider burn per IP.
 */
memesRouter.get(
  '/',
  feedLimiter,
  optionalAuth,
  validate(memesQuerySchema, 'query'),
  listMemesController
);

/** Report a joke — guests allowed (the reporter is the gid cookie). Auto-blocks at the threshold. */
memesRouter.post(
  '/report',
  memeReportLimiter,
  optionalAuth,
  validate(memeReportSchema),
  reportMemeController
);

/** Member save sync — guests keep saves on-device. */
memesRouter.get('/saves', auth, listSavesController);
memesRouter.post('/saves', auth, validate(memeSaveSchema), saveMemeController);
memesRouter.delete(
  '/saves/:source/:externalId',
  auth,
  validate(memeSaveParamsSchema, 'params'),
  unsaveMemeController
);

/**
 * Unfiltered-feed opt-in. Members only, default off — guests and non-opted
 * members always pour filtered. Enabling requires the 18+ self-declaration
 * in the same call; the feed itself reads the stored flag, never a param.
 */
memesRouter.get('/mode', auth, getMemeModeController);
memesRouter.post('/mode', auth, validate(memeModeSchema), setMemeModeController);
