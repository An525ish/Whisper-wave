import { Router } from 'express';
import {
  getMyfriends,
  getNotifications,
  handleRequest,
  sendRequest,
} from '../controllers/friendRequest.js';
import { auth, validate } from '../middlewares/index.js';
import {
  handleRequestSchema,
  sendRequestSchema,
} from '../validators/request.js';

export const friendRequestRouter = Router();

friendRequestRouter.use(auth);

friendRequestRouter.get('/get-notifications', getNotifications);
friendRequestRouter.get('/get-my-friends', getMyfriends);
friendRequestRouter.post('/send-request', validate(sendRequestSchema), sendRequest);
friendRequestRouter.put(
  '/handle-request',
  validate(handleRequestSchema),
  handleRequest
);
