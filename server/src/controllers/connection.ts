import type { RequestHandler } from 'express';
import type { Server } from 'socket.io';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { logger } from '../utils/logger.js';
import { completeConnection, getConnectionOrigin } from '../services/connection.js';
import { emitToMembers } from '../services/presence/index.js';
import { joinUsersToChatRoom } from '../socket/rooms.js';
import { CONNECTION_READY } from '../constants/anon-events.js';
import { WHISPER_CONNECTION_READY, REFETCH_CHATS } from '../constants/socket-events.js';
import type { ConnectionAnnouncement } from '../types/connection.js';
import type { CompleteConnectionBody } from '../types/input.js';

/**
 * Wire up the freshly created DM and tell BOTH parties it exists.
 * - Join each online socket to the new chat room so messages flow live without
 *   a reconnect (the chat was created after they connected).
 * - `/anon` namespace, keyed by anonId → reaches a partner still on the
 *   mutual-vibe screen (their anon socket is open).
 * - main namespace, keyed by userId → reaches a partner who already signed in
 *   and navigated away from /whisper, and refreshes both chat lists.
 *
 * Best-effort: the connection is already persisted, so a failed emit is logged,
 * never surfaced as a request failure.
 */
const announceConnectionReady = async (
  io: Server | undefined,
  payload: ConnectionAnnouncement
): Promise<void> => {
  if (!io) return;
  try {
    const body = { chatId: payload.chatId, connectionId: payload.connectionId };

    await joinUsersToChatRoom(io, payload.chatId, [...payload.userIds]).catch((err: unknown) =>
      logger.warn({ err, chatId: payload.chatId }, 'Failed to join sockets to new DM room')
    );

    const anonNsp = io.of('/anon');
    for (const anonId of payload.anonIds) {
      anonNsp.to(`anon:${anonId}`).emit(CONNECTION_READY, body);
    }
    emitToMembers(io, WHISPER_CONNECTION_READY, payload.userIds, body);
    emitToMembers(io, REFETCH_CHATS, payload.userIds);
  } catch (err) {
    logger.error({ err, chatId: payload.chatId }, 'Failed to announce connection ready');
  }
};

/**
 * POST /api/connection/complete
 *
 * Auth required — must be called after the user signs in/up post-mutual-like.
 * Consumes the connectToken issued at mutual like and either creates the
 * Connection (reusing an existing DM if these two already talk) or reports that
 * the partner hasn't connected yet.
 */
export const completeConnectionController: RequestHandler = catchAsync(
  async (req, res) => {
    const { connectToken } = req.body as CompleteConnectionBody;
    const io = req.app.get('io') as Server | undefined;

    // `auth` runs before this handler, so userId is guaranteed.
    const { result, announce } = await completeConnection(connectToken, req.userId!);

    // Persisted first; notify both parties (esp. the one still waiting) after.
    if (announce) await announceConnectionReady(io, announce);

    res.status(200).json({ success: true, data: result });
  }
);

/**
 * GET /api/connection/:chatId
 *
 * The "how we met" story for a DM. `origin: null` for ordinary conversations so
 * the client renders nothing instead of special-casing.
 */
export const getConnectionForChat: RequestHandler = catchAsync(async (req, res) => {
  const { chatId } = req.params as { chatId?: string };
  if (!chatId) throw new AppError(400, 'chatId is required');

  const origin = await getConnectionOrigin(chatId, req.userId!);

  res.status(200).json({ success: true, data: { origin } });
});
