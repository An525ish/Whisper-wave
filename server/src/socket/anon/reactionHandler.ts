import { onSocketEvent } from '../../middlewares/validateSocket.js';
import { makeRedisSocketRateLimiter } from '../rateLimiter.js';
import { ANON_REACT, MATCH_REACTION } from '../../constants/anon-events.js';
import { anonReactionSchema, applyAnonReaction } from '../../services/match/index.js';
import { logger } from '../../utils/logger.js';
import { emitError, failureCodeFor, reactionAckOf, toReactionEvent } from './shared.js';
import type { AnonSocket } from './types.js';
import type { Namespace } from 'socket.io';

/**
 * `ANON_REACT` — add or remove a curated vibe reaction on one message.
 *
 * Its own file because it is the only /anon handler that is a real
 * read-modify-write with a broadcast to two rooms, and it carries its own
 * limiter and its own failure classification. Keeping it beside the
 * pass-through handlers in `handlers.ts` would blur that difference.
 */

/**
 * Reactions are one tap per message, so this is well above real use — it exists
 * to stop a client writing reaction keys in a loop, not to slow a person down.
 *
 * Redis-backed: /anon is unauthenticated, and each reaction is a read-modify-write
 * against a Redis SET, so the loop this stops is expensive per iteration. See
 * `makeRedisSocketRateLimiter`.
 */
const reactionLimiter = makeRedisSocketRateLimiter('anon-react', 20, 10_000);

export const registerReactionHandler = (socket: AnonSocket, nsp: Namespace): void => {
  onSocketEvent(
    socket,
    ANON_REACT,
    anonReactionSchema,
    async ({ messageId, reaction }, ...rest: unknown[]) => {
      const ack = reactionAckOf(rest);

      let outcome;
      try {
        outcome = await applyAnonReaction(
          socket.sessionId,
          socket.anonId,
          messageId,
          reaction
        );
      } catch (err) {
        // Two distinguishable failures, because the client acts differently on
        // each: a dead session means stop showing this chat as live, an unknown
        // message means just settle the optimistic bubble. Both arrive as a code,
        // never as prose the client has to pattern-match.
        const message = err instanceof Error ? err.message : 'That reaction did not stick';
        const code = failureCodeFor(err) ?? ('invalid_reaction' as const);
        ack?.({ ok: false, messageId, reason: message, code });
        emitError(socket, message, code);
        return;
      }

      // The same event goes to the partner and to the sender — including the
      // sender's other tabs — so an optimistic bubble and a partner bubble settle
      // from ONE code path rather than an ack path and a broadcast path that can
      // disagree. `except` keeps the originating socket from seeing it twice.
      const event = toReactionEvent(outcome);
      nsp.to(`anon:${outcome.partnerAnonId}`).emit(MATCH_REACTION, event);
      nsp.to(`anon:${socket.anonId}`).except(socket.id).emit(MATCH_REACTION, event);
      socket.emit(MATCH_REACTION, event);

      ack?.({ ok: true, messageId });
    },
    {
      before: () => reactionLimiter.allow(socket.id),
      // Without these the middleware falls back to message copy — "Too many
      // messages" when the caller tapped an emoji — and, worse, sends no code, so
      // the client has nothing to branch on and can only put prose on screen.
      rejections: {
        rateLimited: {
          reason: 'Easy — you are reacting a bit fast.',
          code: 'rate_limited',
        },
        invalidPayload: {
          reason: 'That reaction is not one we offer.',
          code: 'invalid_reaction',
        },
        handlerFailed: {
          reason: 'That reaction did not stick.',
          code: 'unknown_message',
        },
      },
      onError: (err) => logger.warn({ err, anonId: socket.anonId }, 'ANON_REACT error'),
    }
  );
};

export const clearReactionLimiter = (socketId: string): void => {
  // Called from the /anon disconnect handler, which cannot await. `remove` is
  // async on a Redis limiter, so make the fire-and-forget explicit — it never
  // rejects, so there is no dangling promise.
  void reactionLimiter.remove(socketId);
};
