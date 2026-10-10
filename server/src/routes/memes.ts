import { Router } from 'express';
import {
  getMemeModeController,
  listMemesController,
  listSavesController,
  saveMemeController,
  setMemeModeController,
  unsaveMemeController,
} from '../controllers/memes.js';
import { auth, optionalAuth, searchLimiter, validate } from '../middlewares/index.js';
import { memeModeSchema, memeSaveParamsSchema, memeSaveSchema, memesQuerySchema } from '../validators/memes.js';

export const memesRouter = Router();

/**
 * Public shuffle feed. `optionalAuth` (not `auth`) so guests read freely and
 * the route stays forward-compatible with member-only features. The shared
 * search limiter caps provider burn per IP.
 */
memesRouter.get(
  '/',
  searchLimiter,
  optionalAuth,
  validate(memesQuerySchema, 'query'),
  listMemesController
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
