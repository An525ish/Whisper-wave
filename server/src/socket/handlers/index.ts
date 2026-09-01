import type { Server } from 'socket.io';
import { messageLimiter } from '../rateLimiter.js';
import { initSocketSession } from './connection.js';
import { registerDisconnectHandler } from './disconnect.js';
import { registerMessageHandler } from './message.js';
import { registerReactionHandler } from './reaction.js';
import { registerTypingHandlers } from './typing.js';

export const registerSocketHandlers = (io: Server): void => {
  io.on('connection', async (socket) => {
    const session = await initSocketSession(io, socket);
    if (!session) return;

    registerMessageHandler(session, messageLimiter);
    registerReactionHandler(session, messageLimiter);
    registerTypingHandlers(session);
    registerDisconnectHandler(session, messageLimiter);
  });
};
