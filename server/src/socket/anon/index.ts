import type { Server } from 'socket.io';
import { applyAnonAuth } from './auth.js';
import { handleAnonConnect, registerAnonHandlers } from './handlers.js';
import type { AnonSocket } from './types.js';
import { logger } from '../../utils/logger.js';

/**
 * Creates the /anon Socket.IO namespace for anonymous matchmaking.
 *
 * Auth: httpOnly `anonId` cookie (issued by POST /api/match/join).
 * No JWT or DB lookup on every connection.
 */
export const createAnonNamespace = (io: Server): void => {
  const nsp = io.of('/anon');

  // Connection-level auth — must run before any event handlers.
  nsp.use((socket, next) => applyAnonAuth(socket as AnonSocket, next));

  nsp.on('connection', (socket) => {
    const anonSocket = socket as AnonSocket;

    logger.info({ anonId: anonSocket.anonId }, 'Anon socket connected');

    // Try to match or enqueue on connect.
    void handleAnonConnect(anonSocket, nsp).catch((err) => {
      logger.error({ err, anonId: anonSocket.anonId }, 'handleAnonConnect failed');
      socket.disconnect();
    });

    // Register all event handlers.
    registerAnonHandlers(anonSocket, nsp);
  });
};
