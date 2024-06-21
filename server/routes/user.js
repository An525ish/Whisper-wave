import { Router } from 'express';
import {
  deleteProfile,
  getProfile,
  searchUser,
  updateProfile,
} from '../controllers/user.js';
import { auth } from '../middlewares/auth.js';

export const userRouter = Router();

userRouter.use(auth);

//protected resources
userRouter
  .get('/get-profile', getProfile)
  .get('/search-user', searchUser)
  .put('/update-profile', updateProfile)
  .delete('/delete-profile', deleteProfile);
