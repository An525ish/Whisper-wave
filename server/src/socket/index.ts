import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { corsOptions } from '../config/cors.js';
import { applySocketAuth } from '../middlewares/index.js';
import { registerSocketHandlers } from './handlers/index.js';
import { createAnonNamespace } from './anon/index.js';

export const createSocketServer = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: corsOptions,
  });

  // Authenticated namespace (default '/') — JWT-based.
  io.use(applySocketAuth);
  registerSocketHandlers(io);

  // Anonymous namespace '/anon' — anonId cookie-based.
  createAnonNamespace(io);

  return io;
};
