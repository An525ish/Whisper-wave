import type { Types } from 'mongoose';
import { AppError } from '../utils/AppError.js';
import * as pendingRepo from '../repositories/pendingConnection.js';
import * as connectionRepo from '../repositories/connection.js';
import * as chatRepo from '../repositories/chat.js';
import * as chatReadRepo from '../repositories/chatRead.js';
import { deleteSession, getSession } from './match/session.js';
import { verifyConnectToken } from './match/connectToken.js';
import { logger } from '../utils/logger.js';
import type { ConnectionOrigin, VibeTag } from '../types/match.js';
import type {
  CompleteConnectionOutcome,
  CompleteConnectionResult,
  ConnectionLean,
  PendingConnectionSideDoc,
} from '../types/connection.js';

const isDuplicateKeyError = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000;

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

/**
 * Resolve the DM for a pair: reuse an existing 1-1 chat when these two accounts
 * already talk, otherwise create one. `Chat.name` is required by the schema (DM
 * titles are recomputed from members on read), so it is seeded with the vibe
 * names they met under. `created` tells the caller whether it owns cleanup.
 */
const resolveDirectChat = async (
  userIdA: Types.ObjectId,
  userIdB: Types.ObjectId,
  seedName: string
): Promise<{ chatId: Types.ObjectId; created: boolean }> => {
  const existing = await chatRepo.findDirectChatBetween(
    userIdA.toString(),
    userIdB.toString()
  );
  if (existing) return { chatId: existing._id, created: false };
  const chat = await chatRepo.create({
    name: seedName,
    creator: userIdA,
    members: [userIdA, userIdB],
  });
  return { chatId: chat._id, created: true };
};

/** Compensating delete for a Chat/ChatRead pair this attempt created but could not attach. */
const discardOrphanChat = async (chatId: Types.ObjectId): Promise<void> => {
  await Promise.all([
    chatRepo.deleteById(chatId.toString()),
    chatReadRepo.deleteByChatId(chatId.toString()),
  ]).catch((err: unknown) =>
    logger.error({ err, chatId }, 'Failed to clean up orphaned chat after connection failure')
  );
};

/**
 * Find-or-create the Connection for a pair, idempotently.
 * - An existing Connection is reused (its chat is re-created if it vanished).
 * - A duplicate-key race on `pairKey` resolves to the winner's Connection.
 * - Chat/ChatRead docs created for a Connection that never materialises are removed.
 */
const ensureConnection = async (params: {
  userIdA: Types.ObjectId;
  userIdB: Types.ObjectId;
  sessionId: string;
  names: [string, string];
  tags: [VibeTag[], VibeTag[]];
}): Promise<ConnectionLean> => {
  const { userIdA, userIdB, sessionId, names, tags } = params;
  const memberIds = [userIdA.toString(), userIdB.toString()];
  const seedName = `${names[0]} & ${names[1]}`;

  const existing = await connectionRepo.findByUsers(memberIds[0], memberIds[1]);
  if (existing) {
    const chat = await chatRepo.findByIdLean(existing.chat.toString());
    if (chat) {
      await chatReadRepo.initForMembers(existing.chat, memberIds);
      return existing;
    }
    // The DM was deleted out from under the Connection — rebuild and re-point it.
    const rebuilt = await resolveDirectChat(userIdA, userIdB, seedName);
    await chatReadRepo.initForMembers(rebuilt.chatId, memberIds);
    await connectionRepo.updateChat(existing._id, rebuilt.chatId);
    return { ...existing, chat: rebuilt.chatId };
  }

  const { chatId, created } = await resolveDirectChat(userIdA, userIdB, seedName);
  try {
    // Both parties have seen everything so far, so seed their read state.
    await chatReadRepo.initForMembers(chatId, memberIds);
    return await connectionRepo.create({
      users: [userIdA, userIdB],
      chatId,
      originAnonSession: sessionId,
      originNames: names,
      originVibeTags: tags,
    });
  } catch (err) {
    if (created) await discardOrphanChat(chatId);
    if (isDuplicateKeyError(err)) {
      // Lost a race on pairKey — the winner's Connection is the answer.
      const winner = await connectionRepo.findByUsers(memberIds[0], memberIds[1]);
      if (winner) return winner;
    }
    throw err;
  }
};

/**
 * Called after a user signs up or logs in via a connectToken.
 *
 * Step 1: Verify the connectToken.
 * Step 2: Find-or-create the PendingConnection and atomically bind this user to
 *         the seat (`side`) their token names (once only — replay-safe).
 * Step 3: If both sides have userIds → complete the connection.
 * Step 4: Return status so the client knows whether to wait or open the DM.
 *
 * Race protection: claimForProcessing atomically moves 'pending' → 'processing'
 * (and re-takes claims stale for > 60 s). Only one caller wins; the other gets
 * 'waiting_for_partner' and learns of completion via the CONNECTION_READY event.
 *
 * Realtime fan-out is NOT done here (services must not depend on sockets): the
 * returned `announce` tells the controller what to emit.
 */
export const completeConnection = async (
  connectToken: string,
  userId: string
): Promise<CompleteConnectionOutcome> => {
  // 1. Verify token. `side` is the holder's seat (0 = anon1, 1 = anon2); the
  //    token carries no anonIds.
  const { sessionId, side, displayName, partnerName, vibeTags, partnerTags } =
    verifyConnectToken(connectToken);
  if (side !== 0 && side !== 1) throw new AppError(401, 'Invalid connect token');
  const partnerSide = side === 0 ? 1 : 0;

  // 2. Find or create PendingConnection, seats ordered by `side`.
  const seats: [PendingConnectionSideDoc, PendingConnectionSideDoc] = [
    { userId: null, displayName: '', vibeTags: [] },
    { userId: null, displayName: '', vibeTags: [] },
  ];
  seats[side] = { userId: null, displayName, vibeTags };
  seats[partnerSide] = { userId: null, displayName: partnerName, vibeTags: partnerTags };
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
    },
  };
};

/**
 * The "how we met" story for a DM that began as an anonymous match.
 *
 * This is what makes the Connection document worth writing: with no read path
 * the origin data is stored and never shown, and the emotional payoff of the
 * whole anonymous layer — "you matched as midnight_fox and blue_static" — is
 * lost. Returns `null` for ordinary DMs, which have no Connection record.
 */
export const getConnectionOrigin = async (
  chatId: string,
  userId: string
): Promise<ConnectionOrigin | null> => {
  const connection = await connectionRepo.findByChatIdPopulated(chatId, userId);
  if (!connection) return null;

  const users = connection.users as unknown as Array<{
    _id: Types.ObjectId;
    name?: string;
    username?: string;
    avatar?: { url?: string };
  }>;

  const selfIndex = users.findIndex((u) => u._id.toString() === userId);
  if (selfIndex === -1) return null;

  const index = selfIndex as 0 | 1;
  const partnerIndex = index === 0 ? 1 : 0;
  const partner = users[partnerIndex];

  return {
    connectionId: connection._id.toString(),
    chatId: connection.chat.toString(),
    originNames: connection.originNames,
    originVibeTags: connection.originVibeTags,
    connectedAt: (connection.connectedAt ?? connection.createdAt)?.toISOString() ?? null,
    selfIndex: index,
    selfAlias: connection.originNames[index],
    partnerAlias: connection.originNames[partnerIndex],
    selfVibes: connection.originVibeTags[index],
    partnerVibes: connection.originVibeTags[partnerIndex],
    partnerName: partner?.name ?? 'Unknown',
    partnerUsername: partner?.username,
    partnerAvatar: partner?.avatar?.url,
  };
};
