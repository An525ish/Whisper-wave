import type { RequestHandler } from 'express';
import { getAdsConfig } from '../services/ads.js';
import { catchAsync } from '../utils/catchAsync.js';

/**
 * GET /api/ads/config: which ad slots to show this visitor. Guest-safe
 * (`optionalAuth` only reads who you are, to skip ads for Spark Pass holders).
 */
export const getAdsConfigController: RequestHandler = catchAsync(async (req, res) => {
  // Depends on the caller's cookie, so it must never be shared between people.
  res.set('Cache-Control', 'private, no-store');
  res.status(200).json({ success: true, data: await getAdsConfig(req.userId) });
});
