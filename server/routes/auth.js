import { Router } from 'express';
import { signIn, signOut, signUp } from '../controllers/auth.js';
import { avatarUpload } from '../middlewares/multer.js';
import { auth } from '../middlewares/auth.js';

export const authRouter = Router();

authRouter
  .post('/signup', avatarUpload, signUp)
  .post('/signin', signIn)
  .post('/signout', auth, signOut);
