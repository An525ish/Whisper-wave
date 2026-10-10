import { Router } from 'express';
import {
  cancelPendingController,
  completeConnectionController,
  getConnectionForChat,
  listPendingController,
} from '../controllers/connection.js';
import { auth, validate } from '../middlewares/index.js';
import { chatIdParamSchema } from '../validators/chat.js';
import { completeConnectionSchema, pendingIdParamSchema } from '../validators/match.js';

export const connectionRouter = Router();

/** Auth required — user must be signed in to complete an anonymous connection. */
connectionRouter.post(
  '/complete',
  auth,
  validate(completeConnectionSchema),
  completeConnectionController
);

/**
 * Auth required — pending connections (claims + rows waiting on the partner).
 * Registered BEFORE `/:chatId` so `pending` is never read as a chat id.
 */
connectionRouter.get('/pending', auth, listPendingController);

/** Auth required — cancel one pending item (claim deleted, row seat released). */
connectionRouter.delete(
  '/pending/:id',
  auth,
  validate(pendingIdParamSchema, 'params'),
  cancelPendingController
);

/** Auth required — the "how we met" story for a DM. */
connectionRouter.get(
  '/:chatId',
  auth,
  validate(chatIdParamSchema, 'params'),
  getConnectionForChat
);
