import type { Types } from 'mongoose';
import type { IReportFields, ReportReason, RoomEvidenceItem } from './match.js';

/** Lean shape of a Report document. */
export type ReportLean = IReportFields & { _id: Types.ObjectId };

type SubmitReportCommon = {
  reason: ReportReason;
  details?: string;
  /** From the httpOnly `anonId` cookie — guests can report without an account. */
  reporterAnonId: string | null;
  /** From the access token, when signed in. */
  reporterUserId: string | null;
};

export type SubmitReportInput =
  | (SubmitReportCommon & { targetType: 'anonSession'; sessionId: string })
  | (SubmitReportCommon & { targetType: 'user'; targetUserId: string; chatId: string });

export type CreateReportInput = {
  reporter?: Types.ObjectId | string | null;
  reporterAnonId?: string | null;
  reporterGid?: string | null;
  targetType: 'user' | 'anonSession' | 'roomMessage';
  targetUserId?: Types.ObjectId | string | null;
  /** Always a string — an anon target is resolved from a session, never an id. */
  targetAnonId?: string | null;
  sessionId?: string | null;
  chatId?: Types.ObjectId | string | null;
  roomSlug?: string | null;
  evidence?: RoomEvidenceItem[] | null;
  reason: ReportReason;
  details?: string | null;
};

export type ReportQueuePage = {
  reports: ReportLean[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
};

/**
 * Filing a room-message report. The reporter names a message id, never a
 * person — the target is whatever alias holds it, resolved server-side.
 */
export type RoomReportInput = {
  instanceId: string;
  roomSlug: string;
  messageId: string;
  reason: ReportReason;
  details?: string;
  reporterUserId?: string | null;
  reporterAnonId?: string | null;
  reporterGid?: string | null;
};
