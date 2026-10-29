import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { corsOptions, isOriginAllowed } from '../config/cors.js';
import { applySocketAuth } from '../middlewares/index.js';
import { registerSocketHandlers } from './handlers/index.js';
import { createAnonNamespace } from './anon/index.js';
import { createRoomsNamespace } from './rooms/index.js';

export const createSocketServer = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: corsOptions,
    // Every namespace: refuse cross-site upgrades (and polling) before any handshake work.
    allowRequest: (req, callback) => {
      callback(null, isOriginAllowed(req.headers.origin, req.headers.host));
    },
  });

  // Authenticated namespace (default '/') — JWT-based.
  io.use(applySocketAuth);
  registerSocketHandlers(io);

  // Anonymous namespace '/anon' — anonId cookie-based.
  createAnonNamespace(io);

  // Rooms namespace '/rooms' — gid-based (guests + members), in-process state.
  createRoomsNamespace(io);

  return io;
};
