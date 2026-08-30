import { Router } from 'express';
import { signUpload } from '../controllers/upload.js';
import { auth, validate } from '../middlewares/index.js';
import { signUploadSchema } from '../validators/upload.js';

export const uploadRouter = Router();

uploadRouter.use(auth);

/** POST /api/upload/sign — issue presigned R2 PUT URLs for direct client uploads. */
uploadRouter.post('/sign', validate(signUploadSchema), signUpload);
