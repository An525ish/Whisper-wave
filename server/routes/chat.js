import { Router } from 'express';
import {
  addMembers,
  createGroupChat,
  deleteGroup,
  getChatDetails,
  getMyChats,
  leaveGroup,
  removeMember,
  updateGroupDetails,
} from '../controllers/chat.js';
import { auth } from '../middlewares/auth.js';

export const chatRouter = Router();

chatRouter.use(auth);

chatRouter
  .get('/get-my-chats', getMyChats)
  .get('/get-chat-details', getChatDetails)
  .post('/create-group', createGroupChat)
  .put('/update-group-details/:chatId', updateGroupDetails) // TODO - avatar, bio update
  .put('/add-members/:chatId', addMembers)
  .put('/remove-members/:chatId', removeMember)
  .delete('/leave-group/:chatId', leaveGroup)
  .delete('/delete-group/:chatId', deleteGroup);
