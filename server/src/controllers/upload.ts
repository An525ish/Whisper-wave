import type { RequestHandler } from 'express';
import { catchAsync } from '../utils/catchAsync.js';
import * as uploadService from '../services/upload/index.js';
import type { SignUploadBody } from '../validators/upload.js';

/**
 * POST /api/upload/sign
 *
 * Returns one presigned R2 PUT URL per requested file.
 * The client uploads directly to R2, then calls /api/message/send-attachments
 * with the returned keys to commit the message.
 */
export const signUpload: RequestHandler = catchAsync(async (req, res) => {
  const { chatId, files } = req.body as SignUploadBody;

  const result = await uploadService.signUploads({
    userId: req.userId!,
    chatId,
    files,
  });

  res.status(200).json({ success: true, data: result });
});
