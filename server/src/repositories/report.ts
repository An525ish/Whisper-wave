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

export const markReviewed = async (id: string, reviewed = true): Promise<ReportLean | null> =>
  Report.findByIdAndUpdate(id, { $set: { reviewed } }, { new: true }).lean<ReportLean>();

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
