import { Router } from 'express';
import {
  clearChatMessages,
  deleteManyMessages,
  deleteMessage,
  editMessage,
  forwardMessages,
  getMessageContext,
  getMessageReceipts,
  getMessages,
  jumpToDate,
  listActiveDates,
  searchMessages,
  sendAttachments,
  sendGif,
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
  getMessagesQuerySchema,
  jumpToDateQuerySchema,
  listActiveDatesQuerySchema,
  searchMessagesQuerySchema,
  sendAttachmentsSchema,
  sendGifSchema,
} from '../validators/message.js';

export const messageRouter = Router();

messageRouter.use(auth);

messageRouter.get(
  '/get-messages/:chatId',
  validate(getMessagesQuerySchema, 'query'),
  getMessages
);
messageRouter.get('/context/:chatId/:messageId', getMessageContext);
messageRouter.get(
  '/search/:chatId',
  searchLimiter,
  validate(searchMessagesQuerySchema, 'query'),
  searchMessages
);
messageRouter.get(
  '/jump-date/:chatId',
  searchLimiter,
  validate(jumpToDateQuerySchema, 'query'),
  jumpToDate
);
messageRouter.get(
  '/active-dates/:chatId',
  searchLimiter,
  validate(listActiveDatesQuerySchema, 'query'),
  listActiveDates
);
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
messageRouter.post('/send-gif', validate(sendGifSchema), sendGif);
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
messageRouter.get('/receipts/:messageId', getMessageReceipts);
