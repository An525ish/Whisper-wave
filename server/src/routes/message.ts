import { Router } from 'express';
import {
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
import { sendAttachmentsSchema } from '../validators/message.js';

export const messageRouter = Router();

messageRouter.use(auth);

messageRouter.get('/get-messages/:chatId', getMessages);
messageRouter.get('/search/:chatId', searchLimiter, searchMessages);
messageRouter.get('/jump-date/:chatId', searchLimiter, jumpToDate);
messageRouter.get('/active-dates/:chatId', searchLimiter, listActiveDates);
messageRouter.post(
  '/send-attachments',
  attachmentsUpload,
  validate(sendAttachmentsSchema),
  sendAttachments
);
