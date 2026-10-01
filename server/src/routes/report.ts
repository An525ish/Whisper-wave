import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { submitReportController } from '../controllers/report.js';
import { validate } from '../middlewares/index.js';
import { submitReportSchema } from '../validators/match.js';

/** 5 reports / 10 min per IP — prevents abuse while allowing genuine reports. */
const reportLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many reports submitted, please try again later' },
});

export const reportRouter = Router();

reportRouter.post(
  '/',
  reportLimiter,
  validate(submitReportSchema),
  submitReportController
);
