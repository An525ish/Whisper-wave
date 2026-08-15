import { Router } from 'express';
import { searchMedia, trendingMedia } from '../controllers/gif.js';
import { auth, searchLimiter } from '../middlewares/index.js';

export const gifRouter = Router();

gifRouter.use(auth);

gifRouter.get('/search', searchLimiter, searchMedia);
gifRouter.get('/trending', searchLimiter, trendingMedia);
