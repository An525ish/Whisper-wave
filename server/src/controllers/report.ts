import type { RequestHandler } from 'express';
import { submitReport } from '../services/report.js';
import { catchAsync } from '../utils/catchAsync.js';
import { anonIdSchema } from '../validators/anon.js';
import type { SubmitReportBody } from '../types/input.js';

/**
 * POST /api/report
 *
 * Guest-accessible by design — reporting must never require an account.
 * All trust rules (target resolution, membership checks, mutual blocking)
 * live in the service.
 */
export const submitReportController: RequestHandler = catchAsync(async (req, res) => {
  const parsedAnonId = anonIdSchema.safeParse(req.cookies?.['anonId']);
  const reporterAnonId = parsedAnonId.success ? parsedAnonId.data : null;

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
