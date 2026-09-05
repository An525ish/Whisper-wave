import { Router } from 'express';
import {
  getMyfriends,
  getNotifications,
  handleRequest,
  sendRequest,
  unfriend,
} from '../controllers/friendRequest.js';
import { auth, validate } from '../middlewares/index.js';
import {
  handleRequestSchema,
  getMyFriendsQuerySchema,
  sendRequestSchema,
} from '../validators/request.js';
import { chatIdParamSchema } from '../validators/chat.js';

export const friendRequestRouter = Router();

friendRequestRouter.use(auth);

friendRequestRouter.get('/get-notifications', getNotifications);
friendRequestRouter.get(
  '/get-my-friends',
  validate(getMyFriendsQuerySchema, 'query'),
  getMyfriends
);
friendRequestRouter.post('/send-request', validate(sendRequestSchema), sendRequest);
friendRequestRouter.put(
  '/handle-request',
  validate(handleRequestSchema),
  handleRequest
);
friendRequestRouter.delete(
  '/unfriend/:chatId',
  validate(chatIdParamSchema, 'params'),
  unfriend
);
