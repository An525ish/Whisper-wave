import { onSocketEvent } from '../../middlewares/validateSocket.js';
import { makeRedisSocketRateLimiter, makeSocketRateLimiter } from '../rateLimiter.js';
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
import { registerReactionHandler } from './reactionHandler.js';
import {
  getSession,
  getActiveSessionId,
  getUserActiveSessions,
  isParticipant,
  getPartner,
  getWaitingCard,
  setWaitingCardUser,
  enqueue,
  queueSize,
  recordLike,
  isVibeUnlocked,
  clearPresence,
  handleSocketDrop,
  endSessionNow,
  acceptAnonMessage,
  checkWhisperQuota,
  checkSkipQuota,
  relayMessage,
  notifyMatchEnded,
  pairOrEnqueue,
  requireActiveParticipant,
} from '../../services/match/index.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/AppError.js';
import { ackOf, clientMessage, emitError, failureCodeFor, likeFailureCodeFor } from './shared.js';
import type { AnonSocket } from '../../types/anonSocket.js';
import type { Namespace } from 'socket.io';
import type { LikeSocketAck, WaitingCard } from '../../types/match.js';
/**
 * The abuse-relevant /anon caps live on Redis.
 *
 * /anon is unauthenticated and trivially scriptable, and an in-process `Map`
 * cannot reclaim its own memory — only a `disconnect` that actually arrives frees
 * an entry, so a crash mid-session strands one entry per socket until the process
 * restarts. On Redis the cap belongs to the cluster and each key expires on its
 * own. See `makeRedisSocketRateLimiter`.
 */
const msgLimiter = makeRedisSocketRateLimiter('anon-msg', 20, 10_000);
const likeLimiter = makeRedisSocketRateLimiter('anon-like', 5, 30_000);
/**
 * Requeue spam guard — one at a time is plenty, and each attempt costs a scan.
 * Shared by `ANON_REQUEUE` and `ANON_NEXT` (a skip requeues too): each event takes
 * ONE token from it, and the internal `requeueSelf` never takes another.
 *
 * All three Redis limiters above are keyed by ANONID, not socket id: a
 * reconnecting client gets a new socket id, so a socket-keyed cap would reset on
 * every reconnect and could be bypassed by simply reconnecting.
 */
const requeueLimiter = makeRedisSocketRateLimiter('anon-requeue', 3, 15_000);

/**
 * Typing stays in-process, deliberately — the one cap here that is not worth a
 * round trip.
 *
 * It is the highest-frequency event in the product by an order of magnitude and
 * the cheapest one: nothing is persisted and it fans out to a single room. Its
 * handler already spends a `requireActiveParticipant` Redis read per event, so a
 * Redis-backed limiter would put a SECOND round trip in front of every typing
 * ping — spending the scarce resource to rate-limit something that costs almost
 * nothing to absorb.
 *
 * 12 / 10 s is also far above anything a client produces (typing indicators fire
 * on a 2–3 s cadence while someone composes and are debounced client-side), so
 * this cap never touches a real person. Its job is to absorb a runaway loop, and
 * a per-connection `Map` absorbs that completely: a socket is held by exactly one
 * process for its whole life, so there is no cross-instance gap to close here.
 * Keyed by socket id (and freed on disconnect) because nothing is persisted and a
 * reconnect "resetting" it gains an attacker nothing.
 */
const typingLimiter = makeSocketRateLimiter(12, 10_000);

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
const requeueSelf = async (socket: AnonSocket, nsp: Namespace): Promise<void> => {
  const card = await getWaitingCard(socket.anonId);
  if (!card) {
    socket.emit(SESSION_EXPIRED, { reason: 'no_identity' });
    emitError(socket, 'Your whisper session expired. Pick an alias to rejoin.');
    return;
  }
  await enterQueue(socket, nsp, card);
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
        const message = clientMessage(err, 'Message not sent');
        if (!(err instanceof AppError)) {
          logger.warn({ err, anonId: socket.anonId }, 'ANON_MESSAGE failed unexpectedly');
        }
        const code = failureCodeFor(err) ?? 'session_ended';
        ack?.({ ok: false, id, reason: message, code });
        emitError(socket, message, code);
        return;
      }

      if (!outcome.accepted) {
        ack?.({
          ok: false,
          id: outcome.id,
          reason: outcome.reason,
          ...(outcome.code ? { code: outcome.code } : {}),
        });
        // A duplicate id means the ORIGINAL bubble is fine — telling the client the
        // message was rejected would flip that delivered bubble to "failed".
        if (outcome.code !== 'duplicate_id') {
          socket.emit(MATCH_MESSAGE_REJECTED, { id: outcome.id, message: outcome.reason });
        }
        return;
      }

      relayMessage(nsp, socket.anonId, socket.id, outcome.partnerAnonId, outcome.message);
      ack?.({ ok: true, id });
    },
    {
      before: () => msgLimiter.allow(socket.anonId),
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
    async (_data, ...rest: unknown[]) => {
      // Optional ack — old clients send none. MATCH_ERROR etc. are still emitted
      // alongside it so they keep working unchanged.
      const ack = ackOf<LikeSocketAck>(rest);
      try {
        const session = await requireActiveParticipant(socket.sessionId, socket.anonId);
        const sessionId = session.sessionId;

        if (!(await isVibeUnlocked(sessionId, session))) {
          const reason = 'Chat a little longer before sending a vibe.';
          emitError(socket, reason);
          ack?.({ ok: false, code: 'locked', reason });
          return;
        }

        const result = await recordLike(sessionId, socket.anonId);
        const partnerAnonId = getPartner(session, socket.anonId);

        if (result.type === 'one_sided') {
          // Vague signal (no identity), plus a durable flag. The client gates the
          // nudge on ITS OWN unlock state, so a like landing during the warm-up
          // window must be replayable rather than a one-shot emit.
          nsp.to(`anon:${partnerAnonId}`).emit(SOMEONE_VIBING);
          nsp.to(`anon:${partnerAnonId}`).emit(MATCH_PARTNER_VIBED, { sessionId });
          ack?.({ ok: true, mutual: false });
          return;
        }

        // Mutual — each side gets its own token.
        socket.emit(MUTUAL_LIKE, { connectToken: result.tokenA });
        nsp.to(`anon:${partnerAnonId}`).emit(MUTUAL_LIKE, { connectToken: result.tokenB });
        logger.info({ sessionId }, 'Mutual anon like');
        ack?.({ ok: true, mutual: true });
      } catch (err) {
        if (!(err instanceof AppError)) {
          logger.warn({ err, anonId: socket.anonId }, 'ANON_LIKE failed unexpectedly');
        }
        const reason = clientMessage(err, 'Could not send a vibe');
        emitError(socket, reason);
        ack?.({ ok: false, code: likeFailureCodeFor(err), reason });
      }
    },
    {
      before: () => likeLimiter.allow(socket.anonId),
      rejections: {
        rateLimited: { reason: 'Easy — too many vibes.', code: 'rate_limited' },
        invalidPayload: { reason: 'Could not send a vibe', code: 'error' },
        handlerFailed: { reason: 'Could not send a vibe', code: 'error' },
      },
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

      // A skip is a new whisper, so it counts against a signed-in account's cap —
      // after the old session is already torn down, because the user clearly meant
      // to leave it whether or not they may start another.
      const quota = await checkSkipQuota(socket.userId);
      if (quota instanceof AppError) {
        emitError(socket, quota.message, 'quota_exceeded');
        return;
      }

      await requeueSelf(socket, nsp);
    },
    {
      // Without this a client could loop skip → scan with no ceiling at all.
      before: () => requeueLimiter.allow(socket.anonId),
      rejections: {
        rateLimited: { reason: 'Easy — you are skipping a bit fast.', code: 'rate_limited' },
      },
      onError: (err) => logger.warn({ err, anonId: socket.anonId }, 'ANON_NEXT error'),
    }
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
      before: () => requeueLimiter.allow(socket.anonId),
      onError: (err) => logger.warn({ err, anonId: socket.anonId }, 'ANON_REQUEUE error'),
    }
  );

  // ── DISCONNECT ────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    // Only the in-process typing limiter is socket-keyed and needs freeing. The
    // Redis limiters are keyed by anonId on purpose (a reconnect must not reset
    // them) and expire by TTL. Fire and forget: `remove` never rejects.
    void typingLimiter.remove(socket.id);

    // Grace period: a dropped socket is not proof of departure. Ignored when the
    // same anonId still has another live socket (a second tab).
    void handleSocketDrop(nsp, socket.anonId, socket.sessionId, socket.id);
  });
};
