import { Router } from 'express';
import { submitFeedbackController } from '../controllers/feedback.js';
import { feedbackLimiter, validate } from '../middlewares/index.js';
import { submitFeedbackSchema } from '../validators/feedback.js';

export const feedbackRouter = Router();

feedbackRouter.post('/', feedbackLimiter, validate(submitFeedbackSchema), submitFeedbackController);
