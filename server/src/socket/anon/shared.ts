import { MATCH_ERROR } from '../../constants/anon-events.js';
import { AppError } from '../../utils/AppError.js';
import type {
  AnonFailureCode,
  AnonLikeFailureCode,
  AnonMessageSide,
  AnonReaction,
  AnonReactionEvent,
  SocketAck,
} from '../../types/match.js';
import type { AnonSocket } from '../../types/anonSocket.js';

/**
 * Helpers shared by the /anon socket handlers.
 *
 * Separate from `handlers.ts` so the failure-classification rules — the part that
 * has to stay consistent across every handler — live in one place instead of
 * being re-derived per event.
 */

/**
 * Tell the client something went wrong.
 *
 * `code` is the machine-readable half. `message` is prose and is allowed to
 * change; the client must never branch on it, only on `code`.
 */
export const emitError = (
  socket: AnonSocket,
  message: string,
  code?: AnonFailureCode
): void => {
  socket.emit(MATCH_ERROR, { message, code });
};

/**
 * The failure class for a `requireActiveParticipant` throw.
 *
 * A dead session is the only reason it refuses, and the client has to stop
 * presenting a dead thread as a live chat when it does. It is an `AppError` of
 * 404/409; anything else is an unexpected failure and is NOT labelled a dead
 * session, because a wrong `session_ended` tells the user a live chat is over
 * when it is not.
 */
export const failureCodeFor = (err: unknown): AnonFailureCode | undefined =>
  err instanceof AppError && (err.statusCode === 404 || err.statusCode === 409)
    ? 'session_ended'
    : undefined;

/** The `ANON_LIKE` ack code for a thrown failure: a dead session, or anything else. */
export const likeFailureCodeFor = (err: unknown): AnonLikeFailureCode =>
  failureCodeFor(err) ? 'no_session' : 'error';

/** Pull a Socket.IO ack callback out of the extra handler arguments. */
export const ackOf = <Ack = SocketAck>(rest: unknown[]): Ack | undefined =>
  rest.find((a): a is Ack & ((...args: never[]) => unknown) => typeof a === 'function');

/**
 * The same, for the reaction ack, which carries a `messageId` rather than the
 * message `id` used by `ANON_MESSAGE`.
 */
export const reactionAckOf = (rest: unknown[]): ((res: unknown) => void) | undefined =>
  rest.find((a) => typeof a === 'function') as ((res: unknown) => void) | undefined;

/**
 * Build the `MATCH_REACTION` wire payload for ONE recipient.
 *
 * `by` is relative to the recipient (`me` / `them`). Neither anonId is sent: the
 * client only ever needs to know which side reacted, and handing it a stranger's
 * id buys it nothing.
 */
export const toReactionEvent = (
  outcome: { messageId: string; reaction: AnonReaction; action: AnonReactionEvent['action'] },
  by: AnonMessageSide
): AnonReactionEvent => ({
  messageId: outcome.messageId,
  reaction: outcome.reaction,
  by,
  action: outcome.action,
});

/**
 * The text a client may see for a failure.
 *
 * Only an `AppError` carries a message written for users. Anything else (a Redis
 * or parse error) can contain keys, hosts or stack detail, so it is replaced by a
 * fixed string — the caller logs the real error.
 */
export const clientMessage = (err: unknown, fallback: string): string =>
  err instanceof AppError ? err.message : fallback;
