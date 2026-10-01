import { AppError } from '../utils/AppError.js';
import { logger } from '../utils/logger.js';
import * as reportRepo from '../repositories/report.js';
import * as chatRepo from '../repositories/chat.js';
import { getSession, getPartner, isParticipant, blockAnonId } from './match/index.js';
import type { SubmitReportBody } from '../validators/match.js';

export type SubmitReportInput = SubmitReportBody & {
  /** From the httpOnly `anonId` cookie — guests can report without an account. */
  reporterAnonId: string | null;
  /** From the access token, when signed in. */
  reporterUserId: string | null;
};
/**
 * Was `userId` a member of `chatId`? Missing ids deny by default.
 */
const isChatMember = async (
  chatId: string | undefined,
  userId: string | null
): Promise<boolean> => {
  if (!chatId || !userId) return false;
  const chat = await chatRepo.findByIdMembers(chatId);
  if (!chat) return false;
  return chat.members.some((m) => m.toString() === userId);
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
 *  2. For a user target we verify the reporter is actually a member of that
 *     chat, so reports can't be weaponised to flood a stranger's queue.
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
    if (!(await isChatMember(chatId, reporterUserId))) {
      throw new AppError(403, 'You are not part of that chat');
    }
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
