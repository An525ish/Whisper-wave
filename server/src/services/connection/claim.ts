import { AppError } from '../../utils/AppError.js';
import { peekClaim } from '../match/claim.js';
import type { CompleteConnectionOutcome } from '../../types/connection.js';
import { bindAndComplete, buildSeats, consumeClaim } from './complete.js';

/**
 * Complete via a mutual-like claim instead of a `connectToken`.
 *
 * The claim is keyed by the caller's `anonId` cookie plus the session — the
 * same browser that was in the session — so the cookie is as strong a proof
 * of seat as the token was. `claimId` names the session being redeemed.
 *
 * The claim is consumed only after the seat binds: a transient failure leaves
 * it intact for retry, and rebinding the same seat is idempotent.
 */
export const completeConnectionWithClaim = async (
  claimId: string,
  userId: string,
  callerAnonId: string | undefined
): Promise<CompleteConnectionOutcome> => {
  if (!callerAnonId) {
    throw new AppError(401, 'No anonymous session on this browser — start a whisper first');
  }
  const claim = await peekClaim(callerAnonId, claimId);
  if (!claim) {
    throw new AppError(410, 'That mutual vibe expired — find them again in a new whisper');
  }
  const partnerSide = claim.seat === 0 ? 1 : 0;
  const seats = buildSeats(
    claim.seat,
    { displayName: claim.originNames[claim.seat], vibeTags: claim.originTags[claim.seat] },
    { displayName: claim.originNames[partnerSide], vibeTags: claim.originTags[partnerSide] }
  );
  const outcome = await bindAndComplete({ sessionId: claim.sessionId, side: claim.seat, seats }, userId);

  await consumeClaim(callerAnonId, claim.sessionId, userId);
  return outcome;
};
