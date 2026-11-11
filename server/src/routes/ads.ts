import { Router } from 'express';
import { getAdsConfigController } from '../controllers/ads.js';
import { optionalAuth } from '../middlewares/index.js';

export const adsRouter = Router();

adsRouter.get('/config', optionalAuth, getAdsConfigController);
