import { Router } from 'express';
import {
  deleteProfile,
  getProfile,
  updateProfile,
} from '../controllers/user.js';
import { auth } from '../middlewares/auth.js';

export const userRouter = Router();

userRouter.use(auth);

//protected resources
userRouter.get('/get-profile', getProfile);
userRouter.patch('/update-profile', updateProfile);
userRouter.delete('/delete-profile', deleteProfile);
