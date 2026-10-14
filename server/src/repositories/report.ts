import { Report } from '../models/report.js';
import type { CreateReportInput, ReportLean } from '../types/report.js';

export const create = async (data: CreateReportInput) => Report.create({ ...data });

export const findUnreviewed = async (limit = 50, skip = 0): Promise<ReportLean[]> =>
  Report.find({ reviewed: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean<ReportLean[]>();

export const countUnreviewed = async (): Promise<number> =>
  Report.countDocuments({ reviewed: false });

export const findById = async (id: string): Promise<ReportLean | null> =>
  Report.findById(id).lean<ReportLean>();

/**
 * Resolve (or reopen) a report. Reopening clears `retainUntil` so a report
 * that is back in the queue can never expire under review.
 */
export const markReviewed = async (
  id: string,
  update: { reviewed: boolean; reviewedAt: Date | null; retainUntil: Date | null; actionNote: string | null }
): Promise<ReportLean | null> =>
  Report.findByIdAndUpdate(id, { $set: update }, { new: true }).lean<ReportLean>();

/**
 * Has this reporter (any of their identity keys) already reported this
 * message since `since`? Backs the room-report reporter-abuse dedupe.
 */
export const existsRecentRoomReport = async (
  messageId: string,
  reporter: { userId?: string | null; gid?: string | null; anonId?: string | null },
  since: Date
): Promise<boolean> => {
  const ors: Record<string, unknown>[] = [];
  if (reporter.userId) ors.push({ reporter: reporter.userId });
  if (reporter.gid) ors.push({ reporterGid: reporter.gid });
  if (reporter.anonId) ors.push({ reporterAnonId: reporter.anonId });
  if (ors.length === 0) return false;
  return Boolean(
    await Report.exists({
      targetType: 'roomMessage',
      roomMessageId: messageId,
      createdAt: { $gte: since },
      $or: ors,
    })
  );
};

/**
 * Has `reporterUserId` already reported `targetUserId` in `chatId` since `since`?
 * Backs the duplicate-report guard; hits the `targetUserId` index.
 */
export const existsRecentUserReport = async (
  reporterUserId: string,
  targetUserId: string,
  chatId: string,
  since: Date
): Promise<boolean> =>
  Boolean(
    await Report.exists({
      reporter: reporterUserId,
      targetType: 'user',
      targetUserId,
      chatId,
      createdAt: { $gte: since },
    })
  );
