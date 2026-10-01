import type { Types } from 'mongoose';
import { Report } from '../models/report.js';
import type { ReportReason } from '../types/match.js';

export type CreateReportInput = {
  reporter?: Types.ObjectId | string | null;
  reporterAnonId?: string | null;
  targetType: 'user' | 'anonSession';
  targetUserId?: Types.ObjectId | string | null;
  /** Always a string — an anon target is resolved from a session, never an id. */
  targetAnonId?: string | null;
  sessionId?: string | null;
  chatId?: Types.ObjectId | string | null;
  reason: ReportReason;
  details?: string | null;
};

export const create = async (data: CreateReportInput) => Report.create({ ...data });

export const findUnreviewed = async (limit = 50, skip = 0) =>
  Report.find({ reviewed: false })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

export const countUnreviewed = async (): Promise<number> =>
  Report.countDocuments({ reviewed: false });

export const markReviewed = async (id: string, reviewed = true) =>
  Report.findByIdAndUpdate(id, { $set: { reviewed } }, { new: true }).lean();
