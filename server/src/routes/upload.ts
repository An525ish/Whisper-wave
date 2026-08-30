import { Router } from 'express';
import { signUpload } from '../controllers/upload.js';
import { auth, validate } from '../middlewares/index.js';
import { signUploadSchema } from '../validators/upload.js';

export const uploadRouter = Router();

uploadRouter.use(auth);

uploadRouter.post('/sign', validate(signUploadSchema), signUpload);
