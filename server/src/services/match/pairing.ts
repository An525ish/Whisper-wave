import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import * as connectionRepo from '../../repositories/connection.js';
import type { AnonSession, PairResult, WaitingCard } from '../../types/match.js';
import { getWaitingCard, reenqueue, tryMatchFromQueue, generateSessionId } from './queue.js';
import { createSession, deleteSession, getSession, isParticipant } from './session.js';

/**
 * Attempt to pair `self` — who MUST already be in the queue — with whoever is
 * waiting. Returns `{ paired: false }` when nobody suitable is available (or when
 * someone else paired us first) — the caller should leave the user queued.
 *
 * Concurrency: the claim inside `tryMatchFromQueue` is one atomic Lua script that
 * checks self is still queued, claims the candidate and removes BOTH from the
 * queue. Two simultaneous matchers can therefore never claim the same candidate,
 * nor claim each other, and after a successful pair neither anonId is left in the
 * queue. That is why there is no global lock and no follow-up dequeue here. If
 * session creation fails after the claim, both sides are put back on the queue and
 * the half-built session is deleted — otherwise the partner would wait forever for
 * a `MATCH_FOUND` that never fires.
 */
export const pairOrEnqueue = async (self: WaitingCard): Promise<PairResult> => {
  // Accounts never rematch someone they already keep: one indexed lookup per
  // join (signed-in users only), held for the scan window instead of looked up
  // per candidate. Guests have no accounts and skip this entirely.
  const connectedUserIds = self.userId
    ? await connectionRepo.listPartnerUserIds(self.userId).catch((err: unknown) => {
        logger.warn({ err, anonId: self.anonId }, 'Failed to load connections — pairing without the skip');
        return new Set<string>();
      })
    : new Set<string>();
  const attempt = await tryMatchFromQueue(self, connectedUserIds);
  if (attempt.outcome === 'self_claimed') return { paired: false, claimedByOther: true };
  if (attempt.outcome === 'none') return { paired: false };
  const { partnerAnonId } = attempt;

  const partner = await getWaitingCard(partnerAnonId);

  if (!partner) {
    // The claim removed BOTH of us from the queue. The partner has no identity
    // card (it expired between scan and claim), so they are not a matchable
    // person and are dropped; self goes back so they keep waiting.
    logger.warn(
      { anonId: self.anonId, partnerAnonId },
      'Claimed partner had no identity card — dropped, self requeued'
    );
    await reenqueue(self.anonId).catch((err: unknown) =>
      logger.warn({ err, anonId: self.anonId }, 'Failed to requeue self after card-less claim')
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

    // Both are now IN a match and the claim already removed both from the queue.
    // Identity cards are intentionally kept (so either can rejoin later).
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
