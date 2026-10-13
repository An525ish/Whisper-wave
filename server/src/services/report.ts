import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import * as reportRepo from '../repositories/report.js';
import * as chatRepo from '../repositories/chat.js';
import { getSession, getPartner, isParticipant, blockAnonId } from './match/index.js';
import type { SubmitReportInput } from '../types/report.js';

/** A repeat report of the same user in the same chat inside this window is a no-op. */
const DUPLICATE_REPORT_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Member ids of `chatId`, or null when the chat does not exist. */
const getChatMemberIds = async (chatId: string): Promise<string[] | null> => {
  const chat = await chatRepo.findByIdMembers(chatId);
  return chat ? chat.members.map((m) => m.toString()) : null;
};

/**
 * Submit an abuse report.
 *
 * Works for signed-in users and guests — reporting must never require an
 * account, or victims won't report.
 *
 * Two trust rules matter, because this endpoint is guest-accessible and the
 * rate limiter is per-IP:
 *  1. The client can never name its own anon target. It is resolved server-side
 *     from the session plus the reporter's own cookie.
 *  2. For a user target we verify BOTH reporter and target are members of that
 *     chat (and differ), and drop repeats within 24h, so reports can't be
 *     weaponised to flood a stranger's queue.
 *
 * A resolved anon target is mutually blocked — the guarantee behind "report &
 * move on": neither side can be re-matched to the other.
 */
export const submitReport = async (input: SubmitReportInput): Promise<void> => {
  const { targetType, reason, details, reporterAnonId, reporterUserId } = input;

  if (!reporterAnonId && !reporterUserId) {
    throw new AppError(401, 'Nothing to tie this report to — start a chat first.');
  }

  let targetAnonId: string | null = null;
  let sessionId: string | null = null;
  let chatId: string | null = null;
  let targetUserId: string | null = null;

  if (input.targetType === 'anonSession') {
    if (!reporterAnonId) throw new AppError(400, 'No anonymous session found');
    sessionId = input.sessionId;

    const session = await getSession(sessionId);
    if (!session || !isParticipant(session, reporterAnonId)) {
      throw new AppError(403, 'You are not part of that session');
    }
    targetAnonId = getPartner(session, reporterAnonId);

    await Promise.all([
      blockAnonId(reporterAnonId, targetAnonId),
      blockAnonId(targetAnonId, reporterAnonId),
    ]).catch((err: unknown) =>
      logger.warn({ err, sessionId }, 'Failed to persist block after report')
    );
  } else {
    chatId = input.chatId;
    targetUserId = input.targetUserId;
    if (!reporterUserId) {
      throw new AppError(401, 'Please sign in to report a user');
    }
    if (targetUserId === reporterUserId) {
      throw new AppError(400, 'You cannot report yourself');
    }
    const memberIds = await getChatMemberIds(chatId);
    if (!memberIds || !memberIds.includes(reporterUserId)) {
      throw new AppError(403, 'You are not part of that chat');
    }
    if (!memberIds.includes(targetUserId)) {
      throw new AppError(400, 'That user is not part of this chat');
    }
    const alreadyReported = await reportRepo.existsRecentUserReport(
      reporterUserId,
      targetUserId,
      chatId,
      new Date(Date.now() - DUPLICATE_REPORT_WINDOW_MS)
    );
    // Idempotent: the earlier report is already in the queue.
    if (alreadyReported) return;
  }

  await reportRepo.create({
    reporter: reporterUserId,
    reporterAnonId,
    targetType,
    targetUserId,
    targetAnonId,
    sessionId,
    chatId,
    reason,
    details: details?.trim() || null,
  });
};
