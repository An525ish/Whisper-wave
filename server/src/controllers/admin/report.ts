import type { RequestHandler } from 'express';
import type { Server } from 'socket.io';
import { listReports, reviewReport } from '../../services/admin/report.js';
import { applyReportAction } from '../../services/admin/reportActions.js';
import { auditModAction } from '../../services/audit.js';
import { evictIdentity } from '../../socket/rooms/index.js';
import { catchAsync } from '../../utils/catchAsync.js';
import type { ValidatedRequest } from '../../middlewares/validate.js';
import type { AdminReportActionBody, AdminReportReviewBody, AdminReportsQuery } from '../../types/adminInput.js';

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

/**
 * POST /api/admin/reports/:id/action — ban the offender (evicting them live)
 * or hide the message. Does not resolve the report.
 */
export const reportActionController: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params as { id: string };
  const result = await applyReportAction(id, req.body as AdminReportActionBody);
  const io = req.app.get('io') as Server | undefined;
  const evicted =
    result.evict && io
      ? evictIdentity(
          io,
          { gid: result.evict.gid, userId: result.evict.userId },
          { slug: result.evict.slug, reason: 'banned' }
        )
      : 0;
  auditModAction({ actorKind: 'admin', actorLabel: 'admin', ...result.audit });
  res.status(200).json({ success: true, data: { report: result.report, applied: result.applied, evicted } });
});
