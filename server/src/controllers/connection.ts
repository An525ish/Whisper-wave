import type { RequestHandler } from 'express';
import type { Server } from 'socket.io';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { logger } from '../utils/logger.js';
import { parseAnonId } from '../socket/identity.js';
import {
  cancelPending,
  completeConnection,
  completeConnectionWithClaim,
  getConnectionOrigin,
  listPendingForUser,
} from '../services/connection.js';
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
 * Consumes either the connectToken issued at mutual like, or a claimId naming
 * a mutual-like claim on this browser's anonId (the tab-closing path), and
 * either creates the Connection (reusing an existing DM if these two already
 * talk) or reports that the partner hasn't connected yet.
 */
export const completeConnectionController: RequestHandler = catchAsync(
  async (req, res) => {
    const body = req.body as CompleteConnectionBody;
    const io = req.app.get('io') as Server | undefined;

    // `auth` runs before this handler, so userId is guaranteed.
    const userId = req.userId!;
    const { result, announce } =
      'claimId' in body
        ? await completeConnectionWithClaim(
            body.claimId,
            userId,
            parseAnonId((req.cookies as Record<string, string> | undefined)?.['anonId'])
          )
        : await completeConnection(body.connectToken, userId);

    // Persisted first; notify both parties (esp. the one still waiting) after.
    if (announce) await announceConnectionReady(io, announce);

    res.status(200).json({ success: true, data: result });
  }
);

/**
 * GET /api/connection/pending
 *
 * Everything this account still owes a whisper connection — or is owed:
 * mutual-like claims on this browser plus rows where I am bound and the
 * partner is not.
 */
export const listPendingController: RequestHandler = catchAsync(async (req, res) => {
  const items = await listPendingForUser(
    req.userId!,
    parseAnonId((req.cookies as Record<string, string> | undefined)?.['anonId'])
  );
  res.status(200).json({ success: true, data: { items } });
});

/**
 * DELETE /api/connection/pending/:id
 *
 * Cancel one pending item. A claim is deleted outright; a row releases only
 * my seat — the partner's side is left to expire, and they get no signal.
 */
export const cancelPendingController: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params as { id: string };
  await cancelPending(
    id,
    req.userId!,
    parseAnonId((req.cookies as Record<string, string> | undefined)?.['anonId'])
  );
  res.status(200).json({ success: true, message: 'Pending connection cancelled' });
});

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
