import { Router } from 'express';
import {
  completeConnectionController,
  getConnectionForChat,
} from '../controllers/connection.js';
import { auth, validate } from '../middlewares/index.js';
import { completeConnectionSchema } from '../validators/match.js';

export const connectionRouter = Router();

/** Auth required — user must be signed in to complete an anonymous connection. */
connectionRouter.post(
  '/complete',
  auth,
  validate(completeConnectionSchema),
  completeConnectionController
);

/** Auth required — the "how we met" story for a DM. */
connectionRouter.get('/:chatId', auth, getConnectionForChat);
