import type { Types } from 'mongoose';
import type { Server } from 'socket.io';
import { AppError } from '../utils/AppError.js';
import * as pendingRepo from '../repositories/pendingConnection.js';
import * as connectionRepo from '../repositories/connection.js';
import * as chatRepo from '../repositories/chat.js';
import * as chatReadRepo from '../repositories/chatRead.js';
import { deleteSession } from './match/session.js';
import { verifyConnectToken } from './match/connectToken.js';
import { emitToMembers } from './presence/index.js';
import { joinUsersToChatRoom } from '../socket/rooms.js';
import { CONNECTION_READY } from '../constants/anon-events.js';
import { WHISPER_CONNECTION_READY, REFETCH_CHATS } from '../constants/socket-events.js';
import { logger } from '../utils/logger.js';
import type { ConnectionOrigin, VibeTag } from '../types/match.js';

/**
 * Wire up the freshly created DM and tell BOTH parties it exists.
 * - Join each online socket to the new chat room so messages flow live without
 *   a reconnect (the chat was created after they connected).
 * - `/anon` namespace, keyed by anonId → reaches a partner still on the
 *   mutual-vibe screen (their anon socket is open).
 * - main namespace, keyed by userId → reaches a partner who already signed in
 *   and navigated away from /whisper, and refreshes both chat lists.
 */
const announceConnectionReady = async (
  io: Server | undefined,
  payload: {
    chatId: string;
    connectionId: string;
    anonIds: [string, string];
    userIds: [string, string];
  }
): Promise<void> => {
  if (!io) return;
  const body = { chatId: payload.chatId, connectionId: payload.connectionId };

  await joinUsersToChatRoom(io, payload.chatId, [...payload.userIds]).catch((err) =>
    logger.warn({ err, chatId: payload.chatId }, 'Failed to join sockets to new DM room')
  );

  const anonNsp = io.of('/anon');
  for (const anonId of payload.anonIds) {
    anonNsp.to(`anon:${anonId}`).emit(CONNECTION_READY, body);
  }
  emitToMembers(io, WHISPER_CONNECTION_READY, payload.userIds, body);
  emitToMembers(io, REFETCH_CHATS, payload.userIds);
};

export type CompleteConnectionResult = {
  chatId: string;
  connectionId: string;
  status: 'connected' | 'waiting_for_partner';
  originNames: [string, string];
  originVibeTags: [VibeTag[], VibeTag[]];
};

/**
 * Called after a user signs up or logs in via a connectToken.
 *
 * Step 1: Verify the connectToken.
 * Step 2: Upsert PendingConnection — populate this user's side.
 * Step 3: If both sides have userIds → complete the connection.
 * Step 4: Return status so the client knows whether to wait or open the DM.
 *
 * Race condition protection: claimForProcessing atomically transitions
 * PendingConnection status from 'pending' → 'processing'. Only the first
 * caller succeeds; the second 401s on the status check.
 */
export const completeConnection = async (
  connectToken: string,
  userId: string,
  io?: Server
): Promise<CompleteConnectionResult> => {
  // 1. Verify token.
  const tokenPayload = verifyConnectToken(connectToken);
  const { sessionId, anonId } = tokenPayload;

  // 2. Find or create PendingConnection.
  let pending = await pendingRepo.findBySessionId(sessionId);
  if (!pending) {
    // First user to arrive — create PendingConnection.
    pending = await pendingRepo.create(sessionId, [
      {
        anonId: tokenPayload.anonId,
        userId: null,
        displayName: tokenPayload.displayName,
        vibeTags: tokenPayload.vibeTags,
      },
      {
        anonId: tokenPayload.partnerAnonId,
        userId: null,
        displayName: tokenPayload.partnerName,
        vibeTags: tokenPayload.partnerTags,
      },
    ]);
  }

  if (pending.status === 'completed') {
    // Connection was already fully created — find and return it.
    const pair = pending.sides
      .map((s) => s.userId?.toString())
      .filter((id): id is string => Boolean(id));
    const conn =
      pair.length === 2 ? await connectionRepo.findByUsers(pair[0], pair[1]) : null;
    if (!conn) throw new AppError(409, 'Connection record missing after completion');
    return {
      chatId: conn.chat.toString(),
      connectionId: conn._id.toString(),
      status: 'connected',
      originNames: conn.originNames as [string, string],
      originVibeTags: conn.originVibeTags as [VibeTag[], VibeTag[]],
    };
  }

  // 3. Populate this user's side.
  const updated = await pendingRepo.populateSideUserId(sessionId, anonId, userId);
  if (!updated) throw new AppError(409, 'PendingConnection not found or expired');

  const sides = updated.sides;
  const bothReady = sides.every((s) => s.userId !== null);

  if (!bothReady) {
    // Partner hasn't connected yet.
    return {
      chatId: '',
      connectionId: '',
      status: 'waiting_for_partner',
      originNames: [sides[0].displayName, sides[1].displayName],
      originVibeTags: [
        sides[0].vibeTags as VibeTag[],
        sides[1].vibeTags as VibeTag[],
      ],
    };
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
    return {
      chatId: '',
      connectionId: '',
      status: 'waiting_for_partner',
      originNames: [sides[0].displayName, sides[1].displayName],
      originVibeTags: [
        sides[0].vibeTags as VibeTag[],
        sides[1].vibeTags as VibeTag[],
      ],
    };
  }

  try {
    // 5. Resolve the DM. Reuse an existing 1-1 chat when these two accounts
    //    already talk, otherwise create one. `Chat.name` is required by the
    //    schema (DM titles are recomputed from members on read), so we seed it
    //    with the vibe names they met under — it is the "how we met" origin.
    const memberIds = [userIdA.toString(), userIdB.toString()];
    const existingChat = await chatRepo.findDirectChatBetween(
      memberIds[0],
      memberIds[1]
    );
    const chatId = existingChat
      ? existingChat._id
      : (
          await chatRepo.create({
            name: `${sides[0].displayName} & ${sides[1].displayName}`,
            creator: userIdA,
            members: [userIdA, userIdB],
          })
        )._id;

    // Both parties have seen everything so far, so seed their read state.
    await chatReadRepo.initForMembers(chatId, memberIds);

    // 6. Create the Connection record.
    const connection = await connectionRepo.create({
      users: [userIdA, userIdB],
      chatId,
      originAnonSession: sessionId,
      originNames: [sides[0].displayName, sides[1].displayName],
      originVibeTags: [
        sides[0].vibeTags as VibeTag[],
        sides[1].vibeTags as VibeTag[],
      ],
    });

    // 7. Mark PendingConnection done + clean up Redis.
    await Promise.all([
      pendingRepo.markCompleted(sessionId),
      deleteSession(sessionId),
    ]);

    // 8. Wire up the DM room + notify BOTH parties (esp. the one still waiting).
    await announceConnectionReady(io, {
      chatId: chatId.toString(),
      connectionId: connection._id.toString(),
      anonIds: [sides[0].anonId, sides[1].anonId],
      userIds: [memberIds[0], memberIds[1]],
    });

    logger.info({ sessionId, userIdA, userIdB, chatId }, 'Connection completed');

    return {
      chatId: chatId.toString(),
      connectionId: connection._id.toString(),
      status: 'connected',
      originNames: [sides[0].displayName, sides[1].displayName],
      originVibeTags: [
        sides[0].vibeTags as VibeTag[],
        sides[1].vibeTags as VibeTag[],
      ],
    };
  } catch (err) {
    // Rollback: reset PendingConnection to pending so the other user can retry.
    // If even this fails the doc is stuck at 'processing' and every later
    // attempt 409s — surface that loudly rather than masking it.
    await pendingRepo
      .updateStatus(sessionId, 'pending')
      .catch((rollbackErr: unknown) =>
        logger.error(
          { err: rollbackErr, sessionId },
          'ROLLBACK FAILED — PendingConnection is stuck in processing; manual fix required'
        )
      );
    logger.error({ err, sessionId }, 'Failed to complete connection — rolled back');
    throw new AppError(500, 'Failed to complete connection, please try again');
  }
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
