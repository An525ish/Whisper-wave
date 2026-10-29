import { logger } from '../../utils/logger.js';
import type { Namespace } from 'socket.io';
import type { AcceptMessageResult, BufferedAnonMessage, StoredAnonMessage } from '../../types/matchMessage.js';
import { MATCH_DISCONNECTED, MATCH_MESSAGE } from '../../constants/anon-events.js';
import { verifyAnonImage } from './image.js';
import { requireActiveParticipant } from './pairing.js';
import { getPartner, recordMessage } from './session.js';
import { inspectMessage, rejectionMessage } from './moderation.js';
import { fileAutoReport } from '../moderation/autoReport.js';

/**
 * A stored message as one specific recipient sees it.
 *
 * The buffer keeps the sender's anonId, which must never reach a client. `from`
 * becomes `'me'` for the sender and `'them'` for everyone else, computed against
 * the RECIPIENT — the same stored row is `'me'` for one side and `'them'` for the
 * other.
 */
export const toWireMessage = (
  message: StoredAnonMessage,
  viewerAnonId: string
): BufferedAnonMessage => ({
  ...(message.id ? { id: message.id } : {}),
  from: message.from === viewerAnonId ? 'me' : 'them',
  content: message.content,
  sentAt: message.sentAt,
  ...(message.image ? { image: { url: message.image.url } } : {}),
});

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
  id: string | undefined,
  imageKey?: string,
  gifUrl?: string
): Promise<AcceptMessageResult> => {
  // Throws AppError for no-session / not-a-participant / not-active.
  const session = await requireActiveParticipant(sessionId, anonId);
  const activeSessionId = session.sessionId;
  // A picked GIF/meme is just a vetted third-party URL: nothing of ours to store or delete.
  const image = imageKey
    ? await verifyAnonImage(activeSessionId, anonId, imageKey)
    : gifUrl
      ? { key: '', url: gifUrl }
      : undefined;

  // First-line moderation. Fails open on internal error (see moderation.ts).
  const verdict = content ? inspectMessage(content) : { allowed: true as const };
  if (!verdict.allowed) {
    logger.info(
      { sessionId: activeSessionId, anonId, reason: verdict.reason, severe: verdict.severe },
      'Blocked anon message'
    );
    // Only the severe set files a report + mutually blocks the pair. Contact and
    // scam solicitation is blocked but never auto-reported, or one spammer could
    // flood the review queue.
    if (verdict.severe) {
      void fileAutoReport({
        sessionId: activeSessionId,
        reporterAnonId: anonId,
        reason: verdict.reason,
      });
    }
    return { accepted: false, id, reason: rejectionMessage() };
  }

  const partnerAnonId = getPartner(session, anonId);
  const message: StoredAnonMessage = {
    ...(id ? { id } : {}),
    from: anonId,
    content,
    sentAt: Date.now(),
    ...(image ? { image } : {}),
  };

  // Buffer in Redis (survives a refresh) — the partner is told only after this
  // succeeds, so a message can't be delivered without being replayable. Also
  // counts the message for the vibe gate and refreshes every TTL, in one command.
  const recorded = await recordMessage(session, message);
  if (!recorded) {
    return {
      accepted: false,
      id,
      reason: 'That message id was already used in this chat.',
      code: 'duplicate_id',
    };
  }

  return { accepted: true, message, partnerAnonId };
};

/**
 * Deliver an accepted message.
 *
 * The partner gets it as `from: 'them'`. The sender's OTHER sockets (a second
 * tab on the same anonId) get it as `from: 'me'` with the same id, so tabs do not
 * desync; the originating socket is excluded because it is told by its ack.
 * Kept separate from `acceptAnonMessage` so the socket layer owns emission.
 */
export const relayMessage = (
  nsp: Namespace,
  senderAnonId: string,
  senderSocketId: string,
  partnerAnonId: string,
  message: StoredAnonMessage
): void => {
  nsp.to(`anon:${partnerAnonId}`).emit(MATCH_MESSAGE, toWireMessage(message, partnerAnonId));
  nsp
    .to(`anon:${senderAnonId}`)
    .except(senderSocketId)
    .emit(MATCH_MESSAGE, toWireMessage(message, senderAnonId));
};

/** Tell a partner their match ended, and why. */
export const notifyMatchEnded = (
  nsp: Namespace,
  partnerAnonId: string,
  reason: 'skipped' | 'disconnected',
  sessionId?: string
): void => {
  nsp.to(`anon:${partnerAnonId}`).emit(MATCH_DISCONNECTED, { reason, sessionId });
};
