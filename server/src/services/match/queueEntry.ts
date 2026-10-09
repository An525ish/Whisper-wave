import { AppError } from '../../utils/AppError.js';
import { v4 as uuid } from 'uuid';
import type { IdentityCardInput, IdentityCardResult, WaitingCard } from '../../types/match.js';
import { dequeue, deleteWaitingCard, getWaitingCard, saveWaitingCard } from './queue.js';
import { clearJoinCounted } from './quota.js';
import { getActiveSessionId, getSession } from './session.js';

/** Shown to the second tab/window of a browser that already holds a live chat. */
export const ALREADY_CHATTING_MESSAGE =
  "You're already chatting with someone in another tab or window of this browser. Finish or leave that chat first.";

/**
 * Register an anon user's identity card (alias, vibes, gender) — and nothing else.
 *
 * This deliberately does NOT enqueue. Enqueueing here ran before the quota,
 * already-matched and active-session checks, so a refused user still sat in the
 * queue and could be paired. The only place that enqueues is the `/anon` socket
 * connect handler, after those gates (see `socket/anon/handlers.ts`).
 *
 * Owns the "reuse the existing anonId or mint one" decision so the controller
 * only has to set the cookie. An existing identity is reused deliberately: a
 * user who backs out of a chat and rejoins should keep their alias rather than
 * be asked to type it again. The account link (`userId`) on that card is kept —
 * it is written by the socket, not by this guest-safe endpoint, and dropping it
 * here would shed the account's blocks and quota until the next socket connect.
 */
export const saveIdentityCard = async (
  input: IdentityCardInput,
  existingAnonId: string | undefined
): Promise<IdentityCardResult> => {
  const anonId = existingAnonId ?? uuid();

  // The anonId is a cookie, so every tab of this browser IS this identity. A second
  // tab picking an alias would be dropped into the first tab's live chat (the socket
  // replays it), i.e. a stranger-looking "new match" that is really the same one.
  // Refuse instead. Refresh-resume is unaffected: it never calls this endpoint.
  if (existingAnonId) {
    const activeId = await getActiveSessionId(existingAnonId);
    const active = activeId ? await getSession(activeId) : null;
    if (active?.status === 'active') throw new AppError(409, ALREADY_CHATTING_MESSAGE);
  }

  const existing = existingAnonId ? await getWaitingCard(anonId) : null;

  const card: WaitingCard = {
    anonId,
    displayName: input.displayName,
    vibeTags: input.vibeTags,
    gender: input.gender,
    ...(existing?.userId ? { userId: existing.userId } : {}),
    joinedAt: Date.now(),
  };
  await saveWaitingCard(card);

  // Submitting the picker again is a NEW whisper, so the previous join's
  // "already counted" marker must not swallow it. Only signed-in joins have one.
  if (existing?.userId) await clearJoinCounted(anonId);

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
