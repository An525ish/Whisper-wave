import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  joinQueueController,
  leaveQueueController,
  quotaController,
} from '../controllers/match.js';
import { auth, validate } from '../middlewares/index.js';
import { joinQueueSchema } from '../validators/match.js';

/** 10 join attempts / minute per IP — prevents queue spam. */
const matchJoinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many join attempts, please slow down' },
});

/** 20 leave attempts / minute per IP — leaving is a queue entry point too. */
const matchLeaveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many leave attempts, please slow down' },
});

export const matchRouter = Router();

matchRouter.post(
  '/join',
  matchJoinLimiter,
  validate(joinQueueSchema),
  joinQueueController
);
matchRouter.delete('/leave', matchLeaveLimiter, leaveQueueController);

/** Members only — guests are never capped, so they have no quota to read. */
matchRouter.get('/quota', auth, quotaController);
