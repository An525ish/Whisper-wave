import type { RequestHandler } from 'express';
import { uploadService } from '../services/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import type { SignUploadBody } from '../validators/upload.js';

export const signUpload: RequestHandler = catchAsync(async (req, res) => {
  const { chatId, files } = req.body as SignUploadBody;
  const result = await uploadService.signUploads({
    userId: req.userId!,
    chatId,
    files,
  });
  res.status(200).json({ success: true, data: result });
});
