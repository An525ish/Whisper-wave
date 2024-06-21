import { Router } from 'express';
import { getMessages, sendAttachments } from '../controllers/message.js';
import { attachmentsUpload } from '../middlewares/multer.js';
import { auth } from '../middlewares/auth.js';

export const messageRouter = Router();

messageRouter.use(auth);

messageRouter
  .get('/get-messages/:chatId', getMessages)
  .post('/send-attachments', attachmentsUpload, sendAttachments);
