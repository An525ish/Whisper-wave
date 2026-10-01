import { logger } from '../../utils/logger.js';
import * as reportRepo from '../../repositories/report.js';
import { getSession, getPartner, isParticipant, blockAnonId } from '../match/index.js';
import type { ModerationReason, ReportReason } from '../../types/match.js';

/** Coarse moderation bucket → the report category a human reviewer will see. */
const REASON_MAP: Record<ModerationReason, ReportReason> = {
  sexual: 'inappropriate_content',
  solicitation: 'spam',
  violence: 'harassment',
  blocked_word: 'inappropriate_content',
};

export type AutoReportInput = {
  sessionId: string;
  /** The sender — the one who should be blocked and reviewed. */
  reporterAnonId: string;
  reason: ModerationReason;
};

/**
 * Server-initiated abuse report.
 *
 * The moderation filter flags a small number of unambiguous categories. Rather
 * than silently dropping those messages we file a report AND mutually block the
 * pair, so the sender cannot re-enter the queue and immediately match the same
 * victim again. Review happens manually via `GET /api/admin/report`.
 *
 * Never throws — a report failure must not break message relay.
 */
export const fileAutoReport = async (input: AutoReportInput): Promise<void> => {
  const { sessionId, reporterAnonId, reason } = input;
  try {
    const session = await getSession(sessionId);
    if (!session || !isParticipant(session, reporterAnonId)) return;

    const targetAnonId = getPartner(session, reporterAnonId);

    await Promise.all([
      reportRepo.create({
        reporter: null,
        // The partner is the victim, so they are the "reporter" on record.
        reporterAnonId: targetAnonId,
        targetType: 'anonSession',
        targetAnonId: reporterAnonId,
        sessionId,
        reason: REASON_MAP[reason],
        // Store the category, never the message body — anon content is not
        // retained by design.
        details: `Auto-flagged by moderation (${reason})`,
      }),
      blockAnonId(reporterAnonId, targetAnonId),
      blockAnonId(targetAnonId, reporterAnonId),
    ]);

    logger.warn(
      { sessionId, targetAnonId: reporterAnonId, reason },
      'Auto-report filed and pair blocked'
    );
  } catch (err) {
    logger.error({ err, sessionId }, 'Failed to file auto-report');
  }
};

/**
 * Fire-and-forget variant used by the message path. Distinguishes "the filter
 * already decided to report" from "this category also warrants a report".
 */
export const maybeAutoReport = async (input: AutoReportInput): Promise<void> => {
  await fileAutoReport(input);
};
