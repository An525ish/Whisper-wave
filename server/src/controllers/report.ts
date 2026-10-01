import type { RequestHandler } from 'express';
import { submitReport } from '../services/report.js';
import { catchAsync } from '../utils/catchAsync.js';
import type { SubmitReportBody } from '../validators/match.js';

/**
 * POST /api/report
 *
 * Guest-accessible by design — reporting must never require an account.
 * All trust rules (target resolution, membership checks, mutual blocking)
 * live in the service.
 */
export const submitReportController: RequestHandler = catchAsync(async (req, res) => {
  const reporterAnonId =
    (req.cookies as Record<string, string | undefined> | undefined)?.['anonId'] ?? null;

  await submitReport({
    ...(req.body as SubmitReportBody),
    reporterAnonId,
    reporterUserId: req.userId ?? null,
  });

  res.status(201).json({
    success: true,
    message: 'Report submitted. Our team will review it shortly.',
  });
});
