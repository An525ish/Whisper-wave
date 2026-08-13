import { Router } from 'express';
import {
  addMembers,
  createGroupChat,
  deleteGroup,
  findChats,
  getChatDetails,
  getMedia,
  getMyChats,
  leaveGroup,
  markChatRead,
  markAllChatsRead,
  removeMember,
  updateGroupDetails,
} from '../controllers/chat.js';
import { auth, avatarUpload, validate } from '../middlewares/index.js';
import {
  addMembersSchema,
  chatIdParamSchema,
  createGroupSchema,
  findChatsSchema,
  markChatReadSchema,
  removeMemberSchema,
  updateGroupSchema,
} from '../validators/chat.js';

export const chatRouter = Router();

chatRouter.use(auth);

chatRouter.get('/get-my-chats', getMyChats);
chatRouter.get('/get-chat-details', getChatDetails);
chatRouter.get('/get-media/:chatId', validate(chatIdParamSchema, 'params'), getMedia);
chatRouter.post(
  '/create-group',
  avatarUpload,
  validate(createGroupSchema),
  createGroupChat
);
chatRouter.post('/find-users', validate(findChatsSchema), findChats);
chatRouter.put('/read-all', markAllChatsRead);
chatRouter.put(
  '/:chatId/read',
  validate(chatIdParamSchema, 'params'),
  validate(markChatReadSchema),
  markChatRead
);
chatRouter.put(
  '/update-group-details/:chatId',
  avatarUpload,
  validate(chatIdParamSchema, 'params'),
  validate(updateGroupSchema),
  updateGroupDetails
);
chatRouter.put(
  '/add-members/:chatId',
  validate(chatIdParamSchema, 'params'),
  validate(addMembersSchema),
  addMembers
);
chatRouter.put(
  '/remove-member/:chatId',
  validate(chatIdParamSchema, 'params'),
  validate(removeMemberSchema),
  removeMember
);
chatRouter.delete(
  '/leave-group/:chatId',
  validate(chatIdParamSchema, 'params'),
  leaveGroup
);
chatRouter.delete(
  '/delete-group/:chatId',
  validate(chatIdParamSchema, 'params'),
  deleteGroup
);
