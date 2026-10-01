import type { RequestHandler } from 'express';
import type { Server } from 'socket.io';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { completeConnection, getConnectionOrigin } from '../services/connection.js';
import type { CompleteConnectionBody } from '../validators/match.js';

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
    const result = await completeConnection(connectToken, req.userId!, io);

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
