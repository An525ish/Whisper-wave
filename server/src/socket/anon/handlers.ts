import { onSocketEvent } from '../../middlewares/validateSocket.js';
import { makeSocketRateLimiter } from '../rateLimiter.js';
import {
  ANON_MESSAGE,
  ANON_TYPING_START,
  ANON_TYPING_STOP,
  ANON_LIKE,
  ANON_NEXT,
  ANON_REQUEUE,
  QUEUE_JOINED,
  MATCH_TYPING_START,
  MATCH_TYPING_STOP,
  SOMEONE_VIBING,
  MUTUAL_LIKE,
  MATCH_MESSAGE_REJECTED,
  MATCH_PARTNER_VIBED,
  SESSION_EXPIRED,
} from '../../constants/anon-events.js';
import {
  anonMessageSchema,
  anonNoPayloadSchema,
} from '../../validators/anon.js';
import { emitMatchFound, emitMatchFoundToSocket } from './emitMatchFound.js';
import { clearReactionLimiter, registerReactionHandler } from './reactionHandler.js';
import {
  getSession,
  getActiveSessionId,
  getUserActiveSessions,
  isParticipant,
  getPartner,
  getWaitingCard,
  setWaitingCardUser,
  reenqueue,
  queueSize,
  recordLike,
  isVibeUnlocked,
  clearPresence,
  handleSocketDrop,
  endSessionNow,
  acceptAnonMessage,
  checkWhisperQuota,
  relayMessage,
  notifyMatchEnded,
  pairOrEnqueue,
  requireActiveParticipant,
} from '../../services/match/index.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/AppError.js';
import { ackOf, emitError, failureCodeFor } from './shared.js';
import type { AnonSocket } from './types.js';
import type { Namespace } from 'socket.io';
import type { WaitingCard } from '../../types/match.js';
const msgLimiter = makeSocketRateLimiter(20, 10_000);
const likeLimiter = makeSocketRateLimiter(5, 30_000);
/** Typing events are cheap but unvalidated traffic aimed at a partner — cap them. */
const typingLimiter = makeSocketRateLimiter(12, 10_000);
/** Requeue spam guard — one at a time is plenty. */
const requeueLimiter = makeSocketRateLimiter(3, 15_000);

/**
 * On socket connect: resume an existing match, or (re)join the queue.
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

  // Bind this anonId to the account that owns this connection, now that we know
  // whether there is one. A signed-out socket CLEARS any link a previous signed-in
  // one wrote, so signing out actually sheds the account — otherwise the next
  // person to hold this anonId would inherit the previous one's blocks and
  // quota. Done before the resume check so a match formed while signed in is
  // still attributable afterwards.
  await setWaitingCardUser(anonId, socket.userId);

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

  // 2. Re-enter the queue with the identity we already hold.
  //
  //    Guests are never capped. Signed-in accounts are, and this is the first
  //    point in the lifecycle where the account is known — the /anon handshake is
  //    what reads the `accessToken` cookie. Costs one INCR, off the match scan,
  //    so `tryMatchFromQueue`'s bounded cost is untouched.
  const quota = await checkWhisperQuota(socket.userId);
  if (quota instanceof AppError) {
    emitError(socket, quota.message, 'quota_exceeded');
    return;
  }

  const card = await getWaitingCard(anonId);
  if (card) {
    await reenqueue(anonId);
    await attemptPair(socket, nsp, card);
    return;
  }

  // 3. No identity at all (first ever visit, or the 24 h card lapsed).
  //    Tell the client to submit the picker again instead of dead-ending.
  emitError(socket, 'Your whisper session expired. Pick an alias to rejoin.');
  socket.emit(SESSION_EXPIRED, { reason: 'no_identity' });
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
const requeueSelf = async (socket: AnonSocket, nsp: Namespace): Promise<void> => {
  const card = await getWaitingCard(socket.anonId);
  if (!card) {
    socket.emit(SESSION_EXPIRED, { reason: 'no_identity' });
    emitError(socket, 'Your whisper session expired. Pick an alias to rejoin.');
    return;
  }
  await reenqueue(socket.anonId);
  await attemptPair(socket, nsp, card);
};

/** Register all inbound event handlers for a connected /anon socket. */
export const registerAnonHandlers = (socket: AnonSocket, nsp: Namespace): void => {
  registerReactionHandler(socket, nsp);

  // ── ANON_MESSAGE ──────────────────────────────────────────────────────────
  onSocketEvent(
    socket,
    ANON_MESSAGE,
    anonMessageSchema,
    async ({ content, id }, ...rest: unknown[]) => {
      const ack = ackOf(rest);

      let outcome;
      try {
        outcome = await acceptAnonMessage(socket.sessionId, socket.anonId, content, id);
      } catch (err) {
        // Session gone / not a participant / not active — the client needs to
        // know so it can mark the bubble failed rather than hang on 'sending'.
        //
        // `code` is what the client branches on. Without it the only way for the
        // client to recognise a dead session is to pattern-match the prose, which
        // drifts the moment either side rewords an error.
        const message = err instanceof Error ? err.message : 'Message not sent';
        const code = failureCodeFor(err) ?? 'session_ended';
        ack?.({ ok: false, id, reason: message, code });
        emitError(socket, message, code);
        return;
      }

      if (!outcome.accepted) {
        ack?.({ ok: false, id: outcome.id, reason: outcome.reason });
        socket.emit(MATCH_MESSAGE_REJECTED, { id: outcome.id, message: outcome.reason });
        return;
      }

      relayMessage(nsp, outcome.partnerAnonId, outcome.message);
      ack?.({ ok: true, id });
    },
    {
      before: () => msgLimiter.allow(socket.id),
      onError: (err) => logger.warn({ err, anonId: socket.anonId }, 'ANON_MESSAGE error'),
    }
  );

  // ── ANON_TYPING_START / STOP ───────────────────────────────────────────────
  const relayTyping = async (event: string): Promise<void> => {
    try {
      const session = await requireActiveParticipant(socket.sessionId, socket.anonId);
      nsp.to(`anon:${getPartner(session, socket.anonId)}`).emit(event);
    } catch (err) {
      logger.debug({ err, anonId: socket.anonId }, `Dropped ${event} for inactive session`);
    }
  };

  onSocketEvent(
    socket,
    ANON_TYPING_START,
    anonNoPayloadSchema,
    async () => relayTyping(MATCH_TYPING_START),
    { before: () => typingLimiter.allow(socket.id) }
  );

  onSocketEvent(
    socket,
    ANON_TYPING_STOP,
    anonNoPayloadSchema,
    async () => relayTyping(MATCH_TYPING_STOP),
    { before: () => typingLimiter.allow(socket.id) }
  );

  // ── ANON_LIKE ─────────────────────────────────────────────────────────────
  onSocketEvent(
    socket,
    ANON_LIKE,
    anonNoPayloadSchema,
    async () => {
      try {
        const session = await requireActiveParticipant(socket.sessionId, socket.anonId);
        const sessionId = session.sessionId;

        if (!(await isVibeUnlocked(sessionId, session))) {
          return emitError(socket, 'Chat a little longer before sending a vibe.');
        }

        const result = await recordLike(sessionId, socket.anonId);
        const partnerAnonId = getPartner(session, socket.anonId);

        if (result.type === 'one_sided') {
          // Vague signal (no identity), plus a durable flag. The client gates the
          // nudge on ITS OWN unlock state, so a like landing during the warm-up
          // window must be replayable rather than a one-shot emit.
          nsp.to(`anon:${partnerAnonId}`).emit(SOMEONE_VIBING);
          nsp.to(`anon:${partnerAnonId}`).emit(MATCH_PARTNER_VIBED, { sessionId });
          return;
        }

        // Mutual — each side gets its own token.
        socket.emit(MUTUAL_LIKE, { connectToken: result.tokenA });
        nsp.to(`anon:${partnerAnonId}`).emit(MUTUAL_LIKE, { connectToken: result.tokenB });
        logger.info({ sessionId }, 'Mutual anon like');
      } catch (err) {
        emitError(socket, err instanceof Error ? err.message : 'Could not send a vibe');
      }
    },
    {
      before: () => likeLimiter.allow(socket.id),
      onError: (err) => logger.warn({ err, anonId: socket.anonId }, 'ANON_LIKE error'),
    }
  );

  // ── ANON_NEXT ─────────────────────────────────────────────────────────────
  onSocketEvent(
    socket,
    ANON_NEXT,
    anonNoPayloadSchema,
    async () => {
      const socketSessionId = socket.sessionId;
      socket.sessionId = undefined;

      // Fall back to the durable Redis pointer rather than trusting the socket
      // field alone.
      //
      // `socket.sessionId` is a cache of "which match this socket is in". If it is
      // ever missing or stale — a socket that joined the room late, a reconnect
      // that raced the fan-out, a deployment that predates the field — then
      // skipping on that value alone silently skips the teardown and the partner
      // is never told their chat ended. They then sit in a dead conversation with
      // no way to learn why. One Redis read is cheap next to that failure.
      const sessionId =
        socketSessionId ?? (await getActiveSessionId(socket.anonId)) ?? undefined;

      if (sessionId) {
        const session = await getSession(sessionId);
        if (session && isParticipant(session, socket.anonId)) {
          // Explicit skip: no grace period, the user clearly meant it.
          const partnerAnonId = await endSessionNow(session, socket.anonId);
          notifyMatchEnded(nsp, partnerAnonId, 'skipped');
        }
      }

      await requeueSelf(socket, nsp);
    },
    { onError: (err) => logger.warn({ err, anonId: socket.anonId }, 'ANON_NEXT error') }
  );

  // ── ANON_REQUEUE ──────────────────────────────────────────────────────────
  // Client-driven retry used when a match ended without the user asking
  // (partner vanished, session lapsed). Idempotent and rate limited.
  onSocketEvent(
    socket,
    ANON_REQUEUE,
    anonNoPayloadSchema,
    async () => {
      const active = await getActiveSessionId(socket.anonId);
      if (active) {
        const session = await getSession(active);
        if (session?.status === 'active' && isParticipant(session, socket.anonId)) {
          await emitMatchFoundToSocket(socket, socket.anonId, session);
          return;
        }
      }
      await requeueSelf(socket, nsp);
    },
    {
      before: () => requeueLimiter.allow(socket.id),
      onError: (err) => logger.warn({ err, anonId: socket.anonId }, 'ANON_REQUEUE error'),
    }
  );

  // ── DISCONNECT ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    msgLimiter.remove(socket.id);
    likeLimiter.remove(socket.id);
    typingLimiter.remove(socket.id);
    requeueLimiter.remove(socket.id);
    clearReactionLimiter(socket.id);

    // Grace period: a dropped socket is not proof of departure.
    void handleSocketDrop(nsp, socket.anonId, socket.sessionId);
  });
};
