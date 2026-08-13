import { Router } from 'express';
import {
  clearChatMessages,
  deleteManyMessages,
  deleteMessage,
  editMessage,
  forwardMessages,
  getMessages,
  jumpToDate,
  listActiveDates,
  searchMessages,
  sendAttachments,
} from '../controllers/message.js';
import {
  attachmentsUpload,
  auth,
  searchLimiter,
  validate,
} from '../middlewares/index.js';
import {
  deleteManyMessagesSchema,
  editMessageSchema,
  forwardMessagesSchema,
  sendAttachmentsSchema,
} from '../validators/message.js';

export const messageRouter = Router();

messageRouter.use(auth);

messageRouter.get('/get-messages/:chatId', getMessages);
messageRouter.get('/search/:chatId', searchLimiter, searchMessages);
messageRouter.get('/jump-date/:chatId', searchLimiter, jumpToDate);
messageRouter.get('/active-dates/:chatId', searchLimiter, listActiveDates);
messageRouter.post(
  '/forward/:targetChatId',
  validate(forwardMessagesSchema),
  forwardMessages
);
messageRouter.post(
  '/send-attachments',
  attachmentsUpload,
  validate(sendAttachmentsSchema),
  sendAttachments
);
messageRouter.post(
  '/delete-many/:chatId',
  validate(deleteManyMessagesSchema),
  deleteManyMessages
);
messageRouter.delete('/clear/:chatId', clearChatMessages);
messageRouter.patch(
  '/:messageId',
  validate(editMessageSchema),
  editMessage
);
messageRouter.delete('/:messageId', deleteMessage);
