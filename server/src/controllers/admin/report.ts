import type { RequestHandler } from 'express';
import { listReports, reviewReport } from '../../services/admin/report.js';
import { catchAsync } from '../../utils/catchAsync.js';
import type { ValidatedRequest } from '../../middlewares/validate.js';
import type { AdminReportReviewBody, AdminReportsQuery } from '../../types/adminInput.js';

/**
 * GET /api/admin/reports?page=&limit=
 * Moderation queue. Admin-only (`requireAdmin` + `validate` in routes/admin.ts).
 */
export const listReportsController: RequestHandler = catchAsync(async (req, res) => {
  const query = (req as ValidatedRequest<AdminReportsQuery>).validatedQuery;
  const data = await listReports(query);
  res.status(200).json({ success: true, data });
});

/** PATCH /api/admin/reports/:id — mark reviewed, optionally extend the block. */
export const reviewReportController: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params as { id: string };
  const data = await reviewReport(id, req.body as AdminReportReviewBody);
  res.status(200).json({ success: true, data });
});
