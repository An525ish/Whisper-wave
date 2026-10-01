import type { RequestHandler } from 'express';
import { listReports, reviewReport } from '../../services/admin/report.js';
import { catchAsync } from '../../utils/catchAsync.js';
import type {
  adminReportsQuerySchema,
  adminReportReviewSchema,
} from '../../validators/admin.js';
import type { z } from 'zod';

/**
 * GET /api/admin/report?page=&limit=
 * Moderation queue. Admin-only (`requireAdmin` + `validate` in routes/admin.ts).
 */
export const listReportsController: RequestHandler = catchAsync(async (req, res) => {
  const data = await listReports(
    req.query as unknown as z.infer<typeof adminReportsQuerySchema>
  );
  res.status(200).json({ success: true, data });
});

/** PATCH /api/admin/report/:id — mark reviewed, optionally extend the block. */
export const reviewReportController: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params as { id: string };
  const data = await reviewReport(
    id,
    req.body as z.infer<typeof adminReportReviewSchema>
  );
  res.status(200).json({ success: true, data });
});
