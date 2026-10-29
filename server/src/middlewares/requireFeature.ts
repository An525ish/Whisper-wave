import type { RequestHandler } from 'express';
import { isFeatureEnabled } from '../services/hub.js';
import type { HubFeatures } from '../types/index.js';
import { AppError } from '../utils/AppError.js';

/**
 * Server-side half of "ship dark" (HUB_PLAN §4.7). The client only hides nav items;
 * this is what actually makes a flag-off surface (and the admin panic card) real.
 * Answers 404, not 403: a switched-off surface should look like it does not exist.
 */
export const requireFeature =
  (feature: keyof HubFeatures): RequestHandler =>
  (_req, _res, next) => {
    if (!isFeatureEnabled(feature)) {
      next(new AppError(404, 'Not found'));
      return;
    }
    next();
  };
