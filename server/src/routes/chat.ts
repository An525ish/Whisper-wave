import { Router } from 'express';
import {
  addMembers,
  createGroupChat,
  deleteGroup,
  deleteChatForMe,
  clearChatForMe,
  findChats,
  getChatDetails,
  getMedia,
  getMyChats,
  leaveGroup,
  markChatRead,
  markAllChatsRead,
  removeMember,
  setMemberAdmin,
  updateGroupDetails,
} from '../controllers/chat.js';
import { auth, avatarUpload, validate } from '../middlewares/index.js';
import {
  addMembersSchema,
  chatIdParamSchema,
  createGroupSchema,
  findChatsSchema,
  getChatDetailsQuerySchema,
  leaveGroupSchema,
  markChatReadSchema,
  removeMemberSchema,
  setMemberAdminSchema,
  updateGroupSchema,
} from '../validators/chat.js';
import { pageQuerySchema } from '../validators/fields.js';

export const chatRouter = Router();

chatRouter.use(auth);

chatRouter.get('/get-my-chats', validate(pageQuerySchema, 'query'), getMyChats);
chatRouter.get(
  '/get-chat-details',
  validate(getChatDetailsQuerySchema, 'query'),
  getChatDetails
);
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
chatRouter.put(
  '/set-admin/:chatId',
  validate(chatIdParamSchema, 'params'),
  validate(setMemberAdminSchema),
  setMemberAdmin
);
chatRouter.delete(
  '/leave-group/:chatId',
  validate(chatIdParamSchema, 'params'),
  validate(leaveGroupSchema),
  leaveGroup
);
chatRouter.delete(
  '/:chatId/for-me',
  validate(chatIdParamSchema, 'params'),
  deleteChatForMe
);
chatRouter.delete(
  '/:chatId/clear-for-me',
  validate(chatIdParamSchema, 'params'),
  clearChatForMe
);
chatRouter.delete(
  '/delete-group/:chatId',
  validate(chatIdParamSchema, 'params'),
  deleteGroup
);
