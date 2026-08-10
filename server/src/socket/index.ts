import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { corsOptions } from '../config/cors.js';
import { applySocketAuth } from '../middlewares/index.js';
import { registerSocketHandlers } from './handlers.js';

export const createSocketServer = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: corsOptions,
  });

  io.use(applySocketAuth);
  registerSocketHandlers(io);

  return io;
};
