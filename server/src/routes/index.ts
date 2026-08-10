import type { Express } from 'express';
import { apiLimiter } from '../middlewares/index.js';
import { authRouter } from './auth.js';
import { chatRouter } from './chat.js';
import { messageRouter } from './message.js';
import { friendRequestRouter } from './request.js';
import { userRouter } from './user.js';

/** Single place to mount all HTTP API routes. */
export const registerRoutes = (app: Express): void => {
  app.use('/api', apiLimiter);
  app.use('/api/auth', authRouter);
  app.use('/api/user', userRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/message', messageRouter);
  app.use('/api/friend-request', friendRequestRouter);
};
