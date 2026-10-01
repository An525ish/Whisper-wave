import { AppError } from '../../utils/AppError.js';
import { v4 as uuid } from 'uuid';
import type { Gender, VibeTag, WaitingCard } from '../../types/match.js';
import {
  dequeue,
  deleteWaitingCard,
  reenqueue,
  saveWaitingCard,
} from './index.js';

export type JoinQueueInput = {
  displayName: string;
  vibeTags: VibeTag[];
  gender: Gender;
};

export type JoinQueueResult = {
  anonId: string;
  /** TRUE when a NEW identity was minted — the caller should set the cookie. */
  isNewIdentity: boolean;
};

/**
 * Register a user in the matchmaking queue.
 *
 * Owns the "reuse the existing anonId or mint one" decision so the controller
 * only has to set the cookie. An existing identity is reused deliberately: a
 * user who backs out of a chat and rejoins should keep their alias rather than
 * be asked to type it again.
 *
 * Note the identity card is *not* deleted here — the queue list is the queue.
 */
export const joinQueue = async (
  input: JoinQueueInput,
  existingAnonId: string | undefined
): Promise<JoinQueueResult> => {
  const anonId = existingAnonId ?? uuid();

  await saveWaitingCard({
    anonId,
    displayName: input.displayName,
    vibeTags: input.vibeTags,
    gender: input.gender,
    joinedAt: Date.now(),
  } satisfies WaitingCard);

  // Idempotent — a refresh/rejoin can't create duplicate queue entries.
  await reenqueue(anonId);

  return { anonId, isNewIdentity: !existingAnonId };
};

/**
 * Graceful queue exit when the user navigates away before being matched.
 * Does NOT end an active session — use the `ANON_NEXT` socket event for that.
 */
export const leaveQueue = async (anonId: string | undefined): Promise<void> => {
  if (!anonId) throw new AppError(400, 'No anonymous session found');
  await Promise.all([dequeue(anonId), deleteWaitingCard(anonId)]);
};
