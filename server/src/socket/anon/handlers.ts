import { onSocketEvent } from '../../middlewares/validateSocket.js';
import { makeRedisSocketRateLimiter, makeSocketRateLimiter } from '../rateLimiter.js';
import { ANON_MESSAGE, ANON_TYPING_START, ANON_TYPING_STOP, ANON_LIKE, ANON_NEXT, ANON_REQUEUE, MATCH_TYPING_START, MATCH_TYPING_STOP, SOMEONE_VIBING, MUTUAL_LIKE, MATCH_MESSAGE_REJECTED, MATCH_PARTNER_VIBED, ANON_READ, MATCH_READ } from '../../constants/anon-events.js';
import { anonMessageSchema, anonNoPayloadSchema, anonReadSchema } from '../../validators/anon.js';
import { identityCardSchema } from '../../validators/match.js';
import { emitMatchFoundToSocket } from './emitMatchFound.js';
import { registerReactionHandler } from './reactionHandler.js';
import { getSession, getActiveSessionId, isParticipant, getPartner, recordLike, isVibeUnlocked, handleSocketDrop, endSessionNow, acceptAnonMessage, relayMessage, notifyMatchEnded, requireActiveParticipant, updateIdentityCard } from '../../services/match/index.js';
import { logger } from '../../utils/logger.js';
import { AppError } from '../../utils/AppError.js';
import { ackOf, clientMessage, emitError, failureCodeFor, likeFailureCodeFor } from './shared.js';
import type { AnonSocket } from '../../types/anonSocket.js';
import type { Namespace } from 'socket.io';
import type { LikeSocketAck } from '../../types/matchMessage.js';
import { requeueSelf } from './connect.js';
import { bumpWhisperStats } from '../../services/match/stats.js';
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

/** Register all inbound event handlers for a connected /anon socket. */
export const registerAnonHandlers = (socket: AnonSocket, nsp: Namespace): void => {
  registerReactionHandler(socket, nsp);

  // ── ANON_MESSAGE ──────────────────────────────────────────────────────────
  onSocketEvent(
    socket,
    ANON_MESSAGE,
    anonMessageSchema,
    async ({ content, id, image, gif }, ...rest: unknown[]) => {
      const ack = ackOf(rest);

      let outcome;
      try {
        outcome = await acceptAnonMessage(socket.sessionId, socket.anonId, content, id, image?.key, gif?.url);
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

  // ── ANON_READ ─────────────────────────────────────────────────────────────
  // Pure relay, like typing: the marker is not stored, so a partner who was offline
  // when it fired simply sees single ticks until the next read. ponytail: upgrade
  // by keeping one marker per side in the session meta hash.
  onSocketEvent(
    socket,
    ANON_READ,
    anonReadSchema,
    async ({ messageId }) => {
      try {
        const session = await requireActiveParticipant(socket.sessionId, socket.anonId);
        nsp.to(`anon:${getPartner(session, socket.anonId)}`).emit(MATCH_READ, { messageId });
      } catch (err) {
        logger.debug({ err, anonId: socket.anonId }, 'Dropped ANON_READ for inactive session');
      }
    },
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

        if (!(await isVibeUnlocked(sessionId, session, socket.anonId))) {
          const reason = 'Keep chatting a bit longer, then you can send a vibe.';
          emitError(socket, reason);
          ack?.({ ok: false, code: 'locked', reason });
          return;
        }

        const result = await recordLike(sessionId, socket.anonId);
        const partnerAnonId = getPartner(session, socket.anonId);

        bumpWhisperStats({ like: 1 });
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
    async (data, ...rest: unknown[]) => {
      const ack = ackOf<(res: { ok: true; identity: boolean }) => void>(rest);
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
        // `status === 'active'` matters: an ended session record lives on for an hour,
        // and `socket.sessionId` can still point at it (the partner skipped first). Without
        // this check we would "end" it again and tell the old partner, who by now is in a
        // NEW chat, that their match ended.
        if (session && session.status === 'active' && isParticipant(session, socket.anonId)) {
          // Explicit skip: no grace period, the user clearly meant it.
          const partnerAnonId = await endSessionNow(session, socket.anonId);
          notifyMatchEnded(nsp, partnerAnonId, 'skipped', session.sessionId);
        }
      }

      // Edits from the profile panel ride along with the skip. They cannot go through
      // POST /match/join: while the old match is still live that call is refused (409,
      // "already chatting in another tab"), so the new vibes never reached the next
      // round. Validated like a join; a bad payload is ignored and never blocks the skip.
      let identityApplied = false;
      const identity = identityCardSchema.safeParse(data?.identity);
      if (identity.success) {
        identityApplied = await updateIdentityCard(socket.anonId, identity.data).catch((err: unknown) => {
          logger.warn({ err, anonId: socket.anonId }, 'Identity update on skip failed');
          return false;
        });
      }
      ack?.({ ok: true, identity: identityApplied });

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
