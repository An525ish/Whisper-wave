import type { Express } from 'express';
import { apiLimiter } from '../middlewares/index.js';
import { adminRouter } from './admin.js';
import { authRouter } from './auth.js';
import { chatRouter } from './chat.js';
import { connectionRouter } from './connection.js';
import { gifRouter } from './gif.js';
import { linkPreviewRouter } from './linkPreview.js';
import { matchRouter } from './match.js';
import { messageRouter } from './message.js';
import { friendRequestRouter } from './request.js';
import { reportRouter } from './report.js';
import { uploadRouter } from './upload.js';
import { userRouter } from './user.js';

/** Single place to mount all HTTP API routes. */
export const registerRoutes = (app: Express): void => {
  app.use('/api', apiLimiter);
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/user', userRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/message', messageRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/gif', gifRouter);
  app.use('/api/link-preview', linkPreviewRouter);
  app.use('/api/friend-request', friendRequestRouter);
  // Phase 2 — anonymous matchmaking
  app.use('/api/match', matchRouter);
  app.use('/api/connection', connectionRouter);
  app.use('/api/report', reportRouter);
};
