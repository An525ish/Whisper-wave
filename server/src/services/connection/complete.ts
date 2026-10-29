import type { Types } from 'mongoose';
import { AppError } from '../../utils/AppError.js';
import * as pendingRepo from '../../repositories/pendingConnection.js';
import * as connectionRepo from '../../repositories/connection.js';
import { deleteSession, getSession } from '../match/session.js';
import { verifyConnectToken } from '../match/connectToken.js';
import { takeClaim } from '../match/claim.js';
import { logger } from '../../utils/logger.js';
import type { VibeTag } from '../../types/match.js';
import type {
  CompleteConnectionOutcome,
  CompleteConnectionResult,
  ConnectionLean,
  PendingConnectionSideDoc,
} from '../../types/connection.js';
import { WHISPER_CONNECTION_READY } from '../../constants/socket-events.js';
import type { RealtimeNotify } from '../../types/chat.js';
import { ensureConnection } from './dm.js';

/**
 * "Connection saved" push for each side, naming the OTHER side's identity-card
 * name (already public to them). Both sides are account holders by now; the
 * dispatcher drops whoever is online. `event` is never emitted, only pushed.
 */
export const buildConnectionPushes = (
  userIds: [string, string],
  names: [string, string]
): RealtimeNotify[] =>
  userIds.map((id, i) => ({
    event: WHISPER_CONNECTION_READY,
    members: [id],
    push: { kind: 'connection', displayName: names[1 - i] },
  }));

const waiting = (
  sides: [PendingConnectionSideDoc, PendingConnectionSideDoc]
): CompleteConnectionOutcome => ({
  result: {
    chatId: '',
    connectionId: '',
    status: 'waiting_for_partner',
    originNames: [sides[0].displayName, sides[1].displayName],
    originVibeTags: [sides[0].vibeTags, sides[1].vibeTags],
  },
  announce: null,
});

const connectedResult = (
  chatId: string,
  connectionId: string,
  names: [string, string],
  tags: [VibeTag[], VibeTag[]]
): CompleteConnectionResult => ({
  chatId,
  connectionId,
  status: 'connected',
  originNames: names,
  originVibeTags: tags,
});

type SeatInfo = Pick<PendingConnectionSideDoc, 'displayName' | 'vibeTags'>;

/** Both seats of a session, ordered by `side` (0 = anon1, 1 = anon2), unbound. */
export const buildSeats = (
  side: 0 | 1,
  own: SeatInfo,
  partner: SeatInfo
): [PendingConnectionSideDoc, PendingConnectionSideDoc] => {
  return [
    { userId: null, ...(side === 0 ? own : partner) },
    { userId: null, ...(side === 1 ? own : partner) },
  ];
};

/**
 * Consume the caller's Redis claim for this session once their seat is bound,
 * so the pending list never offers a connection that is already theirs.
 * Best-effort: a failure leaves a claim the list filters out on its own.
 */
export const consumeClaim = async (
  callerAnonId: string | undefined,
  sessionId: string,
  userId: string
): Promise<void> => {
  if (!callerAnonId) return;
  const taken = await takeClaim(callerAnonId, sessionId).catch((err: unknown) => {
    logger.warn({ err, sessionId }, 'Failed to consume claim after seat bind');
    return null;
  });
  if (!taken) {
    logger.debug({ sessionId, userId }, 'No claim to consume — already redeemed or expired');
  }
};

/**
 * Called after a user signs up or logs in via a connectToken.
 *
 * Step 1: Verify the connectToken.
 * Steps 2-7: shared with the claim path (see `bindAndComplete`). The caller's
 * claim for the same session (if any) is consumed once the seat is bound.
 */
export const completeConnection = async (
  connectToken: string,
  userId: string,
  callerAnonId?: string
): Promise<CompleteConnectionOutcome> => {
  // 1. Verify token. `side` is the holder's seat (0 = anon1, 1 = anon2); the
  //    token carries no anonIds.
  const { sessionId, side, displayName, partnerName, vibeTags, partnerTags } =
    verifyConnectToken(connectToken);
  if (side !== 0 && side !== 1) throw new AppError(401, 'Invalid connect token');

  // 2. Find or create PendingConnection, seats ordered by `side`.
  const seats = buildSeats(
    side,
    { displayName, vibeTags },
    { displayName: partnerName, vibeTags: partnerTags }
  );
  const outcome = await bindAndComplete({ sessionId, side, seats }, userId);
  await consumeClaim(callerAnonId, sessionId, userId);
  return outcome;
};

/**
 * Steps 2-7 of completion, shared by the token and claim paths.
 *
 * Race protection: claimForProcessing atomically moves 'pending' → 'processing'
 * (and re-takes claims stale for > 60 s). Only one caller wins; the other gets
 * 'waiting_for_partner' and learns of completion via the CONNECTION_READY event.
 *
 * Realtime fan-out is NOT done here (services must not depend on sockets): the
 * returned `announce` tells the controller what to emit.
 */
export const bindAndComplete = async (
  params: {
    sessionId: string;
    side: 0 | 1;
    seats: [PendingConnectionSideDoc, PendingConnectionSideDoc];
  },
  userId: string
): Promise<CompleteConnectionOutcome> => {
  const { sessionId, side, seats } = params;
  const pending = await pendingRepo.findOrCreate(sessionId, seats);

  if (pending.status === 'completed') {
    // Already fully created — only the account bound to this token's seat may
    // read it back.
    if (pending.sides[side].userId?.toString() !== userId) {
      throw new AppError(403, 'This connection belongs to a different account');
    }
    const pair = pending.sides
      .map((s) => s.userId?.toString())
      .filter((id): id is string => Boolean(id));
    const conn =
      pair.length === 2 ? await connectionRepo.findByUsers(pair[0], pair[1]) : null;
    if (!conn) throw new AppError(409, 'Connection record missing after completion');
    return {
      result: connectedResult(
        conn.chat.toString(),
        conn._id.toString(),
        conn.originNames,
        conn.originVibeTags
      ),
      announce: null,
    };
  }

  // 3. Bind this user to their seat — only if it is unbound or already theirs.
  const updated = await pendingRepo.bindSideToUser(sessionId, side, userId);
  if (!updated) {
    throw new AppError(403, 'This connect link was already used by another account');
  }

  const sides = updated.sides;
  if (sides.some((s) => s.userId === null || s.userId === undefined)) {
    return waiting(sides); // Partner hasn't connected yet.
  }

  const userIdA = sides[0].userId as Types.ObjectId;
  const userIdB = sides[1].userId as Types.ObjectId;

  // A single account can never occupy both sides of one anon session — that
  // happens when someone runs two tabs/browsers and matches with themselves.
  // It would otherwise build a self-DM and a degenerate Connection record.
  if (userIdA.toString() === userIdB.toString()) {
    throw new AppError(
      409,
      'This match was with your own other session — nothing to connect.'
    );
  }

  // 4. Both ready — atomically claim processing rights.
  const claimed = await pendingRepo.claimForProcessing(sessionId);
  if (!claimed) {
    // Another request got here first — wait for CONNECTION_READY socket event.
    return waiting(sides);
  }

  const names: [string, string] = [sides[0].displayName, sides[1].displayName];
  const tags: [VibeTag[], VibeTag[]] = [sides[0].vibeTags, sides[1].vibeTags];

  let connection: ConnectionLean;
  try {
    // 5. Resolve chat + Connection (idempotent — safe to retry after a failure).
    connection = await ensureConnection({ userIdA, userIdB, sessionId, names, tags });
    // 6. Only after the Connection exists is the claim marked completed.
    await pendingRepo.markCompleted(sessionId);
  } catch (err) {
    // Release the claim so a retry can proceed. ensureConnection is idempotent,
    // so a Connection created before a later failure is simply reused. If even
    // the release fails, claimForProcessing's stale-claim takeover recovers it.
    await pendingRepo
      .updateStatus(sessionId, 'pending')
      .catch((rollbackErr: unknown) =>
        logger.error(
          { err: rollbackErr, sessionId },
          'ROLLBACK FAILED — PendingConnection stays in processing until the stale-claim window passes'
        )
      );
    logger.error({ err, sessionId }, 'Failed to complete connection — rolled back');
    throw new AppError(500, 'Failed to complete connection, please try again');
  }

  // 7. Resolve the anon ids for the announcement (they live only in Redis),
  //    then clean up. Redis work is best-effort: the session expires on its own.
  const session = await getSession(sessionId).catch((err: unknown) => {
    logger.warn({ err, sessionId }, 'Could not read anon session for announcement');
    return null;
  });
  await deleteSession(sessionId).catch((err: unknown) =>
    logger.warn({ err, sessionId }, 'Failed to delete anon session after connection')
  );

  const chatId = connection.chat.toString();
  logger.info({ sessionId, userIdA, userIdB, chatId }, 'Connection completed');

  return {
    result: connectedResult(chatId, connection._id.toString(), names, tags),
    announce: {
      chatId,
      connectionId: connection._id.toString(),
      anonIds: session ? [session.anon1, session.anon2] : [],
      userIds: [userIdA.toString(), userIdB.toString()],
      pushNotifications: buildConnectionPushes(
        [userIdA.toString(), userIdB.toString()],
        names
      ),
    },
  };
};
