import { MATCH_ERROR } from '../../constants/anon-events.js';
import { AppError } from '../../utils/AppError.js';
import type { AnonFailureCode, AnonReaction, AnonReactionEvent, SocketAck } from '../../types/match.js';import type { AnonSocket } from './types.js';

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

/** Pull a Socket.IO ack callback out of the extra handler arguments. */
export const ackOf = (rest: unknown[]): SocketAck | undefined =>
  rest.find((a): a is SocketAck => typeof a === 'function');

/**
 * The same, for the reaction ack, which carries a `messageId` rather than the
 * message `id` used by `ANON_MESSAGE`.
 */
export const reactionAckOf = (rest: unknown[]): ((res: unknown) => void) | undefined =>
  rest.find((a) => typeof a === 'function') as ((res: unknown) => void) | undefined;

/**
 * Apply a reaction result to a wire payload.
 *
 * `partnerAnonId` is deliberately dropped: it is a routing detail for the
 * broadcaster, and sending a stranger's anonId over the wire buys the client
 * nothing it does not already have.
 */
export const toReactionEvent = (
  outcome: {
    messageId: string;
    reaction: AnonReaction;
    anonId: string;
    action: AnonReactionEvent['action'];
  }
): AnonReactionEvent => ({
  messageId: outcome.messageId,
  reaction: outcome.reaction,
  anonId: outcome.anonId,
  action: outcome.action,
});
