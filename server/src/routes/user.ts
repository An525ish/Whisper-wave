import { Router } from 'express';
import {
  deleteProfile,
  getProfile,
  searchUser,
  updateProfile,
} from '../controllers/user.js';
import { auth, avatarUpload, searchLimiter, validate } from '../middlewares/index.js';
import { updateProfileSchema } from '../validators/request.js';

export const userRouter = Router();

userRouter.use(auth);

userRouter.get('/get-profile', getProfile);
userRouter.get('/search-user', searchLimiter, searchUser);
userRouter.put(
  '/update-profile',
  avatarUpload,
  validate(updateProfileSchema),
  updateProfile
);
userRouter.delete('/delete-profile', deleteProfile);
