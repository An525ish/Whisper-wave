import { Router } from 'express';
import { getMessages, sendAttachments } from '../controllers/message.js';
import { attachmentsUpload, auth, validate } from '../middlewares/index.js';
import { sendAttachmentsSchema } from '../validators/message.js';

export const messageRouter = Router();

messageRouter.use(auth);

messageRouter.get('/get-messages/:chatId', getMessages);
messageRouter.post(
  '/send-attachments',
  attachmentsUpload,
  validate(sendAttachmentsSchema),
  sendAttachments
);
