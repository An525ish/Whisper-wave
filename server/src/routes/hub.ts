import { Router } from 'express';
import { getHubSummaryController } from '../controllers/hub.js';

export const hubRouter = Router();

hubRouter.get('/summary', getHubSummaryController);
