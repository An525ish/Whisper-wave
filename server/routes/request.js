import { Router } from 'express';
import { auth } from '../middlewares/auth.js';
import {
  getMyfriends,
  getNotifications,
  handleRequest,
  sendRequest,
} from '../controllers/friendRequest.js';

export const friendRequestRouter = Router();

friendRequestRouter.use(auth);

friendRequestRouter
  .get('/get-notifications', getNotifications)
  .get('/get-my-friends', getMyfriends)
  .post('/send-request', sendRequest)
  .put('/handle-request', handleRequest);
