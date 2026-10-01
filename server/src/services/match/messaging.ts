import { logger } from '../../utils/logger.js';
import type { Namespace } from 'socket.io';
import type { BufferedAnonMessage } from '../../types/match.js';
import { MATCH_DISCONNECTED, MATCH_MESSAGE } from '../../constants/anon-events.js';
import { requireActiveParticipant } from './pairing.js';
import { bufferMessage, getPartner, touchSession } from './session.js';
import { touchWaitingCard } from './queue.js';
import { inspectMessage, rejectionMessage, shouldAutoReport } from './moderation.js';
import { maybeAutoReport } from '../moderation/autoReport.js';

export type AcceptMessageResult =
  | { accepted: true; message: BufferedAnonMessage; partnerAnonId: string }
  | { accepted: false; id?: string; reason: string };

/**
 * Validate, moderate, buffer and relay one anonymous message.
 *
 * All the business rules for `ANON_MESSAGE` live here rather than in the socket
 * handler, which only wires the event. Returns a discriminated result so the
 * caller can ack the sender without re-deriving why it failed.
 */
export const acceptAnonMessage = async (
  sessionId: string | undefined,
  anonId: string,
  content: string,
  id: string | undefined
): Promise<AcceptMessageResult> => {
  // Throws AppError for no-session / not-a-participant / not-active.
  const session = await requireActiveParticipant(sessionId, anonId);
  const activeSessionId = session.sessionId;

  // First-line moderation. Fails open on internal error (see moderation.ts).
  const verdict = inspectMessage(content);
  if (!verdict.allowed) {
    logger.info(
      { sessionId: activeSessionId, anonId, reason: verdict.reason },
      'Blocked anon message'
    );
    // Severe categories file a report + mutually block the pair.
    void maybeAutoReport({
      sessionId: activeSessionId,
      reporterAnonId: anonId,
      reason: verdict.reason,
    });
    return { accepted: false, id, reason: rejectionMessage() };
  }

  // Allowed, but severe enough to warrant a report + block on its own.
  if (shouldAutoReport(content)) {
    void maybeAutoReport({
      sessionId: activeSessionId,
      reporterAnonId: anonId,
      reason: 'sexual',
    });
  }

  const partnerAnonId = getPartner(session, anonId);
  const message: BufferedAnonMessage = { id, from: anonId, content, sentAt: Date.now() };

  // Buffer in Redis (survives a refresh) — the partner is told only after this
  // succeeds, so a message can't be delivered without being replayable.
  await bufferMessage(activeSessionId, message);

  // Keep both the session and the identity card alive.
  await touchSession(activeSessionId);
  await touchWaitingCard(anonId);

  return { accepted: true, message, partnerAnonId };
};

/**
 * Relay a message to the partner's anonId room.
 * Kept separate from `acceptAnonMessage` so the socket layer owns emission.
 */
export const relayMessage = (
  nsp: Namespace,
  partnerAnonId: string,
  message: BufferedAnonMessage
): void => {
  nsp.to(`anon:${partnerAnonId}`).emit(MATCH_MESSAGE, message);
};

/** Tell a partner their match ended, and why. */
export const notifyMatchEnded = (
  nsp: Namespace,
  partnerAnonId: string,
  reason: 'skipped' | 'disconnected'
): void => {
  nsp.to(`anon:${partnerAnonId}`).emit(MATCH_DISCONNECTED, { reason });
};
