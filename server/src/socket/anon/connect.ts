import { QUEUE_JOINED, SESSION_EXPIRED } from '../../constants/anon-events.js';
import { emitMatchFound, emitMatchFoundToSocket } from './emitMatchFound.js';
import { getSession, getActiveSessionId, getUserActiveSessions, isParticipant, getWaitingCard, setWaitingCardUser, enqueue, queueSize, clearPresence, checkWhisperQuota, pairOrEnqueue } from '../../services/match/index.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/AppError.js';
import { emitError } from './shared.js';
import type { AnonSocket } from '../../types/anonSocket.js';
import type { Namespace } from 'socket.io';
import type { WaitingCard } from '../../types/match.js';

/**
 * On socket connect: resume an existing match, or (re)join the queue — or, for a
 * resume-only handshake, ONLY resume.
 * Must be called AFTER applyAnonAuth sets socket.anonId.
 */
export const handleAnonConnect = async (
  socket: AnonSocket,
  nsp: Namespace
): Promise<void> => {
  const { anonId } = socket;

  await socket.join(`anon:${anonId}`);

  // We're back — cancel any pending disconnect grace period.
  await clearPresence(anonId);

  // Resume-only handshake (page refresh mid-match): replay the live session or say
  // there is none — and NOTHING else. Before the card write below on purpose: this
  // path must never create or modify a card, enqueue, or count quota.
  if (socket.resumeOnly) {
    await resumeOnly(socket, anonId);
    return;
  }

  // Bind this anonId to the account that owns this connection, now that we know
  // whether there is one. A signed-out socket CLEARS any link a previous signed-in
  // one wrote, so signing out actually sheds the account — otherwise the next
  // person to hold this anonId would inherit the previous one's blocks and
  // quota. Done before the resume check so a match formed while signed in is
  // still attributable afterwards. Returns the (updated) card so it is read once.
  const card = await setWaitingCardUser(anonId, socket.userId);

  // 1. Resume an interrupted match (page refresh / flaky network).
  const activeSessionId = await getActiveSessionId(anonId);

  // A signed-in account can hold several anon identities (phone + laptop), and
  // the anonId pointer above can only ever see one of them — so without this
  // check the same account gets matched into two live threads at once. Guests
  // are unaffected, and a resumed match short-circuits before we get here.
  if (!activeSessionId && socket.userId) {
    const elsewhere = await getUserActiveSessions(socket.userId, anonId);
    if (elsewhere.length > 0) {
      emitError(
        socket,
        'You are already in a whisper on another device. Finish that one first.',
        'already_matched'
      );
      return;
    }
  }

  if (activeSessionId) {
    const session = await getSession(activeSessionId);
    if (session?.status === 'active' && isParticipant(session, anonId)) {
      await emitMatchFoundToSocket(socket, anonId, session);
      return;
    }
  }

  // 2. No identity at all (first ever visit, or the 24 h card lapsed).
  //    Tell the client to submit the picker again instead of dead-ending.
  if (!card) {
    emitError(socket, 'Your whisper session expired. Pick an alias to rejoin.');
    socket.emit(SESSION_EXPIRED, { reason: 'no_identity' });
    return;
  }

  // 3. Enter the queue — the ONLY place a fresh join is enqueued, and only after
  //    every gate above (account elsewhere, active match) has passed. POST
  //    /api/match/join just saves the identity card.
  //
  //    Guests are never capped. Signed-in accounts are, and this is the first
  //    point in the lifecycle where the account is known — the /anon handshake is
  //    what reads the `accessToken` cookie. A refresh or reconnect inside the
  //    marker window is the same whisper and is not counted again.
  const quota = await checkWhisperQuota(socket.userId, anonId);
  if (quota instanceof AppError) {
    emitError(socket, quota.message, 'quota_exceeded');
    return;
  }

  await enterQueue(socket, nsp, card);
};

/**
 * Resume an existing active session for this anonId, or emit SESSION_EXPIRED
 * (`reason: 'no_session'`) to this socket. Read-only on queue, card and quota.
 */
const resumeOnly = async (socket: AnonSocket, anonId: string): Promise<void> => {
  const activeSessionId = await getActiveSessionId(anonId);
  const session = activeSessionId ? await getSession(activeSessionId) : null;
  if (session?.status === 'active' && isParticipant(session, anonId)) {
    await emitMatchFoundToSocket(socket, anonId, session);
    return;
  }
  socket.emit(SESSION_EXPIRED, { reason: 'no_session' });
};

/**
 * Put this user on the queue and try to pair them. The enqueue refuses (returns
 * false) when the anonId already holds an active match — a second tab racing a
 * pairing must not put a matched user back into the queue.
 */
const enterQueue = async (
  socket: AnonSocket,
  nsp: Namespace,
  card: WaitingCard
): Promise<void> => {
  if (!(await enqueue(socket.anonId))) {
    logger.debug({ anonId: socket.anonId }, 'Skipped enqueue — already in an active match');
    return;
  }
  await attemptPair(socket, nsp, card);
};

/**
 * Try to pair this user, or leave them queued. Safe to call repeatedly and from
 * two sockets at once — the atomic Lua claim guarantees exactly one winner.
 */
const attemptPair = async (
  socket: AnonSocket,
  nsp: Namespace,
  card: WaitingCard
): Promise<void> => {
  const result = await pairOrEnqueue(card);

  if (!result.paired) {
    // Somebody else paired us first and is about to emit MATCH_FOUND to our room —
    // a QUEUE_JOINED now could land after it and flip the client back to waiting.
    if (result.claimedByOther) return;
    socket.emit(QUEUE_JOINED, { position: 'unknown', queueSize: await queueSize() });
    return;
  }

  await emitMatchFound(
    nsp,
    result.sessionId,
    socket.anonId,
    result.partner.anonId,
    card,
    result.partner,
    result.createdAt
  );
  logger.info({ sessionId: result.sessionId, anonId: socket.anonId }, 'Anon match created');
};

/** Put this user back in the queue (identity card is retained). */
export const requeueSelf = async (socket: AnonSocket, nsp: Namespace): Promise<void> => {
  const card = await getWaitingCard(socket.anonId);
  if (!card) {
    socket.emit(SESSION_EXPIRED, { reason: 'no_identity' });
    emitError(socket, 'Your whisper session expired. Pick an alias to rejoin.');
    return;
  }
  await enterQueue(socket, nsp, card);
};
