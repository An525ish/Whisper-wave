import { getRedis } from '../../config/redis.js';
import { logger } from '../../utils/logger.js';
import * as reportRepo from '../../repositories/report.js';
import { blockAnonId } from '../match/block.js';
import { REDIS_KEYS, TTL } from '../match/keys.js';
import { getPartner, getSession, isParticipant } from '../match/session.js';
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
 * Only the SEVERE categories reach here (CSAM-adjacent, violence threats — see
 * `moderation.ts`). Rather than silently dropping those messages we file a report
 * AND mutually block the pair, so the sender cannot re-enter the queue and
 * immediately match the same victim again. Review happens manually via
 * `GET /api/admin/reports`.
 *
 * Deduplicated per (session, category) with a SET NX marker: without it a sender
 * could repeat a flagged message and mint one report (and one Mongo write) per
 * send. If Redis cannot answer, the report is skipped and logged — the message
 * itself is already blocked.
 *
 * Never throws — a report failure must not break message relay.
 */
export const fileAutoReport = async (input: AutoReportInput): Promise<void> => {
  const { sessionId, reporterAnonId, reason } = input;
  try {
    const first = await getRedis().set(
      REDIS_KEYS.autoReported(sessionId, reason),
      '1',
      'EX',
      TTL.autoReport,
      'NX'
    );
    if (first !== 'OK') return; // already reported for this category in this session

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
    // Release the dedupe marker so the next flagged message can retry the report.
    await getRedis()
      .del(REDIS_KEYS.autoReported(sessionId, reason))
      .catch((e: unknown) => logger.warn({ err: e, sessionId }, 'Failed to release auto-report marker'));
  }
};
