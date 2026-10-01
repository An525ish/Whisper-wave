import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import type { AnonSession, PairResult, WaitingCard } from '../../types/match.js';
import {
  deleteSession,
  dequeue,
  getWaitingCard,
  reenqueue,
  tryMatchFromQueue,
  createSession,
  generateSessionId,
  getSession,
  isParticipant,
} from './index.js';

/**
 * Attempt to pair `self` with whoever is waiting. Returns `{ paired: false }`
 * when nobody suitable is available — the caller should leave the user queued.
 *
 * Concurrency: the claim inside `tryMatchFromQueue` is an atomic Lua `LREM`, so
 * two simultaneous matchers can never claim the same candidate. That is why
 * there is no global lock here. If session creation fails after the claim, both
 * sides are put back on the queue and the half-built session is deleted —
 * otherwise the partner would wait forever for a `MATCH_FOUND` that never fires.
 */
export const pairOrEnqueue = async (self: WaitingCard): Promise<PairResult> => {
  const partnerAnonId = await tryMatchFromQueue(self);
  if (!partnerAnonId) return { paired: false };

  const partner = await getWaitingCard(partnerAnonId);

  if (!partner) {
    // We already LREM'd them off the queue, so they are no longer waiting.
    // Put them back rather than silently dropping them from matchmaking.
    logger.warn(
      { anonId: self.anonId, partnerAnonId },
      'Claimed partner had no identity card — requeued'
    );
    await reenqueue(partnerAnonId).catch((err: unknown) =>
      logger.warn({ err, partnerAnonId }, 'Failed to requeue partner with no identity card')
    );
    return { paired: false };
  }

  const sessionId = generateSessionId();

  try {
    // Carries each side's account (when signed in) into the session, so a block
    // raised later survives them signing in and a fresh anonId.
    const created = await createSession({
      sessionId,
      anon1: self.anonId,
      anon2: partnerAnonId,
      name1: self.displayName,
      name2: partner.displayName,
      tags1: self.vibeTags,
      tags2: partner.vibeTags,
      ...(self.userId ? { userId1: self.userId } : {}),
      ...(partner.userId ? { userId2: partner.userId } : {}),
    });

    // Both are now IN a match, so neither should sit in the queue.
    // Identity cards are intentionally kept (so either can rejoin later).
    await Promise.all([dequeue(self.anonId), dequeue(partnerAnonId)]);

    return { paired: true, sessionId, createdAt: created.createdAt, partner, self };
  } catch (err) {
    logger.error(
      { err, sessionId, anonId: self.anonId, partnerAnonId },
      'Failed to create anon match — rolling back'
    );
    await Promise.all([
      deleteSession(sessionId).catch((e: unknown) =>
        logger.warn({ e, sessionId }, 'Failed to delete half-built session')
      ),
      reenqueue(self.anonId).catch((e: unknown) =>
        logger.warn({ e, anonId: self.anonId }, 'Failed to requeue self after match failure')
      ),
      reenqueue(partnerAnonId).catch((e: unknown) =>
        logger.warn({ e, anonId: partnerAnonId }, 'Failed to requeue partner after match failure')
      ),
    ]);
    throw new AppError(503, 'Could not start that chat. Finding someone else…');
  }
};

/**
 * Confirm an anonId is an active participant of a session.
 *
 * The single place this invariant is enforced — every socket handler calls it
 * instead of re-deriving "get session + is participant + is it active".
 */
export const requireActiveParticipant = async (
  sessionId: string | undefined,
  anonId: string
): Promise<AnonSession> => {
  if (!sessionId) throw new AppError(409, 'No active session');

  const session = await getSession(sessionId);
  if (!session || !isParticipant(session, anonId)) {
    throw new AppError(404, 'Session not found or expired');
  }
  if (session.status !== 'active') {
    throw new AppError(409, 'Session is no longer active');
  }
  return session;
};
