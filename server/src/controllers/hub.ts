import type { RequestHandler } from 'express';
import { getHubSummary } from '../services/hub.js';

/**
 * GET /api/hub/summary
 *
 * Public: the hub is open to guests, and the payload holds nothing personal.
 */
export const getHubSummaryController: RequestHandler = (_req, res) => {
  res.status(200).json({ success: true, data: getHubSummary() });
};
