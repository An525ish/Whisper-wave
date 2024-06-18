import { Router } from 'express';
import {
  addMembers,
  createGroupChat,
  deleteGroup,
  getMyChats,
  leaveGroup,
  removeMember,
} from '../controllers/chat.js';
import { auth } from '../middlewares/auth.js';

export const chatRouter = Router();

chatRouter.use(auth);

chatRouter
  .get('/get-my-chats', getMyChats)
  .post('/create-group', createGroupChat)
  .put('/add-members/:chatId', addMembers)
  .put('/remove-members/:chatId', removeMember)
  .delete('/leave-group/:chatId', leaveGroup)
  .delete('/delete-group/:chatId', deleteGroup);
