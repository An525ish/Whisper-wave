import type { Express } from 'express';
import { apiLimiter, ensureGid } from '../middlewares/index.js';
import { adminRouter } from './admin.js';
import { authRouter } from './auth.js';
import { chatRouter } from './chat.js';
import { connectionRouter } from './connection.js';
import { gifRouter } from './gif.js';
import { hubRouter } from './hub.js';
import { linkPreviewRouter } from './linkPreview.js';
import { matchRouter } from './match.js';
import { memesRouter } from './memes.js';
import { messageRouter } from './message.js';
import { roomsRouter } from './rooms.js';
import { friendRequestRouter } from './request.js';
import { reportRouter } from './report.js';
import { uploadRouter } from './upload.js';
import { userRouter } from './user.js';

/** Single place to mount all HTTP API routes. */
export const registerRoutes = (app: Express): void => {
  app.use('/api', apiLimiter);
  // Stable guest identity first: every API caller leaves with a gid cookie,
  // and routes read `req.identity` instead of raw cookies.
  app.use('/api', ensureGid);
  app.use('/api/auth', authRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/user', userRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/message', messageRouter);
  app.use('/api/upload', uploadRouter);
  app.use('/api/gif', gifRouter);
  app.use('/api/hub', hubRouter);
  app.use('/api/link-preview', linkPreviewRouter);
  app.use('/api/friend-request', friendRequestRouter);
  // Phase 2 — anonymous matchmaking
  app.use('/api/match', matchRouter);
  app.use('/api/connection', connectionRouter);
  app.use('/api/report', reportRouter);
  // Hub Phase 2 — laughs feed (provider jokes + generated images)
  app.use('/api/memes', memesRouter);
  // Hub Phase 3 — topic rooms (behind FEATURE_ROOMS on the client)
  app.use('/api/rooms', roomsRouter);
};
