import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import * as reportRepo from '../../repositories/report.js';
import { blockAnonId } from '../match/index.js';
import type { AdminReportReviewBody, AdminReportsQuery } from '../../types/adminInput.js';
import type { ReportQueuePage, ReportReason } from '../../types/report.js';

const DAY_MS = 24 * 3_600_000;

/** HUB_PLAN §9.4: 90 days after resolution; child safety 1 year (18 U.S.C. §2258A). */
export const RETAIN_DAYS = 90;
export const RETAIN_DAYS_CHILD_SAFETY = 365;

/** When a resolved report's evidence may be deleted (Mongo TTL on `retainUntil`). */
export const computeRetainUntil = (reason: ReportReason, reviewedAt: Date): Date =>
  new Date(
    reviewedAt.getTime() +
      (reason === 'underage' ? RETAIN_DAYS_CHILD_SAFETY : RETAIN_DAYS) * DAY_MS
  );

/**
 * The moderation queue.
 *
 * Without this, every auto-filed report (services/moderation/autoReport.ts) and
 * every user report landed in Mongo and was never read by anyone — the "manual
 * review" the whole abuse strategy depends on wasn't actually possible.
 */
export const listReports = async (
  query: AdminReportsQuery
): Promise<ReportQueuePage> => {
  const { page, limit } = query;
  const skip = (page - 1) * limit;

  const [reports, total] = await Promise.all([
    reportRepo.findUnreviewed(limit, skip),
    reportRepo.countUnreviewed(),
  ]);

  return { reports, total, page, limit, hasMore: skip + reports.length < total };
};

/**
 * Mark a report reviewed, optionally extending the block between the pair.
 *
 * A confirmed abuse report should also keep the two anonIds apart, so a user who
 * reported someone can't be re-matched to them after both accounts exist.
 */
export const reviewReport = async (
  id: string,
  input: AdminReportReviewBody
) => {
  const existing = await reportRepo.findById(id);
  if (!existing) throw new AppError(404, 'Report not found');

  // Resolving starts the retention clock (kept from the first review); reopening
  // stops it, so a report back in the queue can never expire under review.
  const reviewedAt = input.reviewed ? (existing.reviewedAt ?? new Date()) : null;
  const updated = await reportRepo.markReviewed(id, {
    reviewed: input.reviewed,
    reviewedAt,
    retainUntil: reviewedAt ? computeRetainUntil(existing.reason, reviewedAt) : null,
    actionNote: input.reviewed ? (input.actionNote ?? null) : existing.actionNote,
  });
  if (!updated) throw new AppError(404, 'Report not found');

  if (input.blockAnonId && updated.targetAnonId && updated.reporterAnonId) {
    await Promise.all([
      blockAnonId(updated.targetAnonId, updated.reporterAnonId),
      blockAnonId(updated.reporterAnonId, updated.targetAnonId),
    ]).catch((err: unknown) =>
      logger.warn({ err, id }, 'Failed to extend block from admin review')
    );
  }

  return updated;
};
