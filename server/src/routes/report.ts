import { Router } from 'express';
import { submitReportController } from '../controllers/report.js';
import { optionalAuth, reportLimiter, validate } from '../middlewares/index.js';
import { submitReportSchema } from '../validators/match.js';

export const reportRouter = Router();

// Guest-accessible, but a signed-in reporter must be identified (user-target
// reports require a verified account) — hence optionalAuth, not auth.
reportRouter.post(
  '/',
  reportLimiter,
  optionalAuth,
  validate(submitReportSchema),
  submitReportController
);
