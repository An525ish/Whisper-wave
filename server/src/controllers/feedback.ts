import type { RequestHandler } from 'express';
import { submitFeedback } from '../services/feedback.js';
import { catchAsync } from '../utils/catchAsync.js';
import type { SubmitFeedbackBody } from '../validators/feedback.js';

/** POST /api/feedback. Guest-accessible, rate limited, emails the maker. */
export const submitFeedbackController: RequestHandler = catchAsync(async (req, res) => {
  await submitFeedback(req.body as SubmitFeedbackBody);
  res.status(201).json({ success: true, message: 'Sent. Thanks.' });
});
