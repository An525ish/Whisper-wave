import type { Types } from 'mongoose';

export type ReportReason =
  | 'inappropriate_content'
  | 'harassment'
  | 'spam'
  | 'underage'
  | 'impersonation'
  | 'other';

/** One line of a report evidence snapshot — alias, text and time only. No IPs. */
export type RoomEvidenceItem = {
  alias: string;
  text: string;
  /** Photo/GIF/meme on the message. Photos point at the kept copy, not the live one. */
  media?: { kind: 'image' | 'gif' | 'meme'; url: string };
  ts: number;
  /** The message was hidden (mod/auto) when the snapshot was taken. */
  hidden?: boolean;
};

export type IReportFields = {
  reporter: Types.ObjectId | null; // null = anonymous reporter
  reporterAnonId: string | null;
  reporterGid: string | null;
  targetType: 'user' | 'anonSession' | 'roomMessage';
  targetUserId: Types.ObjectId | null;
  /**
   * Room reports: the offender's guest id, resolved server-side from the live
   * message at filing. Server/admin only — never sent to non-admin clients.
   */
  targetGid: string | null;
  targetAnonId: string | null;
  sessionId: string | null;
  chatId: Types.ObjectId | null;
  /** Room context snapshot (reported message + neighbours, alias + text + ts). */
  roomSlug: string | null;
  /** Live instance + message id, so an admin can still hide it if it is live. */
  roomInstanceId: string | null;
  roomMessageId: string | null;
  evidence: RoomEvidenceItem[] | null;
  reason: ReportReason;
  details: string | null;
  reviewed: boolean;
  reviewedAt: Date | null;
  /** What was done — the RUNBOOK's "mark reviewed with what was done". */
  actionNote: string | null;
  /**
   * TTL expiry (Mongo deletes at this instant). Set only when a report is
   * resolved. Unresolved reports and legacy docs without it never expire.
   */
  retainUntil: Date | null;
  createdAt: Date;
};

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
  targetGid?: string | null;
  /** Always a string — an anon target is resolved from a session, never an id. */
  targetAnonId?: string | null;
  sessionId?: string | null;
  chatId?: Types.ObjectId | string | null;
  roomSlug?: string | null;
  roomInstanceId?: string | null;
  roomMessageId?: string | null;
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

/** Automod-filed room report: the system is the reporter; dedupe is the caller's. */
export type AutoRoomReportInput = {
  instanceId: string;
  slug: string;
  messageId: string;
  /** e.g. 'csam' | 'self_harm' | 'violence' — child-safety maps to `underage`. */
  category: string;
};
