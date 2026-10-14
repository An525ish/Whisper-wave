import * as reportRepo from '../../repositories/report.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import { getEvidenceWindow } from './registry.js';
import type { AutoRoomReportInput, ReportReason, RoomEvidenceItem, RoomReportInput } from '../../types/report.js';

/** HUB_PLAN §9.4: the reported message plus 30 around it (15 each side). */
export const EVIDENCE_RADIUS = 15;

/** Same reporter + same message inside this window files nothing new. */
const REPORT_DEDUPE_MS = 24 * 3_600_000;

/** Automod categories that mean child safety — filed as `underage` (1-year retention). */
const CHILD_SAFETY_CATEGORIES = new Set(['csam', 'child_safety', 'minor', 'underage']);

/**
 * Evidence = the reported message plus neighbours (alias + text + ts only) —
 * the narrow, disclosed exception to "rooms leave no transcript". Built from
 * the raw ring INCLUDING hidden messages: a mod delete or auto-hide only sets
 * a flag, so the offending text is still here and a delete never destroys it.
 * Null target (message aged out or the instance closed) is an error, never a
 * fallback to "the last 15 lines" — that would be evidence of the wrong thing.
 */
const resolveEvidence = (instanceId: string, messageId: string) => {
  const { items, target } = getEvidenceWindow(instanceId, messageId, EVIDENCE_RADIUS);
  if (!target) return null;
  const evidence: RoomEvidenceItem[] = items.map(({ alias, text, ts, hidden }) => ({
    alias,
    text,
    ts,
    hidden: hidden === true,
  }));
  return { evidence, target };
};

/**
 * File a room-message report with its evidence snapshot. Returns false when
 * the same reporter already reported this message (reporter-abuse dedupe).
 *
 * The reporter names a message, never a person — the offender's identity is
 * resolved server-side from the live message and stored admin-only. Reports
 * never auto-delete; auto-hide only removes from history.
 */
export const fileRoomReport = async (input: RoomReportInput): Promise<boolean> => {
  const since = new Date(Date.now() - REPORT_DEDUPE_MS);
  const duplicate = await reportRepo.existsRecentRoomReport(
    input.messageId,
    { userId: input.reporterUserId, gid: input.reporterGid, anonId: input.reporterAnonId },
    since
  );
  if (duplicate) return false;
  const resolved = resolveEvidence(input.instanceId, input.messageId);
  if (!resolved) throw new AppError(410, 'That message is no longer available to report');
  await reportRepo.create({
    reporter: input.reporterUserId ?? null,
    reporterAnonId: input.reporterAnonId ?? null,
    reporterGid: input.reporterGid ?? null,
    targetType: 'roomMessage',
    targetGid: resolved.target.senderGid,
    targetUserId: resolved.target.senderUserId ?? null,
    roomSlug: input.roomSlug,
    roomInstanceId: input.instanceId,
    roomMessageId: input.messageId,
    evidence: resolved.evidence,
    reason: input.reason,
    details: input.details?.trim() || null,
  });
  return true;
};

/**
 * System-filed report for a severe automod hit. No reporter — the system is
 * the reporter; dedupe is the caller's. Never throws on a vanished message
 * (the hit already blocked it); logs and returns false instead.
 */
export const fileAutoRoomReport = async (input: AutoRoomReportInput): Promise<boolean> => {
  const resolved = resolveEvidence(input.instanceId, input.messageId);
  if (!resolved) {
    logger.warn({ instanceId: input.instanceId, category: input.category }, 'Auto room report: message not in ring');
    return false;
  }
  const reason: ReportReason = CHILD_SAFETY_CATEGORIES.has(input.category)
    ? 'underage'
    : 'inappropriate_content';
  await reportRepo.create({
    targetType: 'roomMessage',
    targetGid: resolved.target.senderGid,
    targetUserId: resolved.target.senderUserId ?? null,
    roomSlug: input.slug,
    roomInstanceId: input.instanceId,
    roomMessageId: input.messageId,
    evidence: resolved.evidence,
    reason,
    details: `Automod: ${input.category}`,
  });
  return true;
};
