import { onSocketEvent } from '../../middlewares/validateSocket.js';
import { makeSocketRateLimiter } from '../rateLimiter.js';
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
 */
const reactionLimiter = makeSocketRateLimiter(20, 10_000);

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
      onError: (err) => logger.warn({ err, anonId: socket.anonId }, 'ANON_REACT error'),
    }
  );
};

export const clearReactionLimiter = (socketId: string): void => reactionLimiter.remove(socketId);
