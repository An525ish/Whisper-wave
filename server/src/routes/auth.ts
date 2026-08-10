import { Router } from 'express';
import { signIn, signOut, signUp } from '../controllers/auth.js';
import {
  auth,
  authLimiter,
  avatarUpload,
  validate,
} from '../middlewares/index.js';
import { signInSchema, signUpSchema } from '../validators/auth.js';

export const authRouter = Router();

authRouter.use(authLimiter);

authRouter.post('/signup', avatarUpload, validate(signUpSchema), signUp);
authRouter.post('/signin', validate(signInSchema), signIn);
authRouter.post('/signout', auth, signOut);
