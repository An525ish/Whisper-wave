import type { RequestHandler } from 'express';
import { userService } from '../services/index.js';
import type { UpdateProfileInput } from '../types/user.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getProfile: RequestHandler = catchAsync(async (req, res) => {
  const user = await userService.getProfile(req.userId!);
  res.status(200).json({ success: true, user });
});

export const updateProfile: RequestHandler = catchAsync(async (req, res) => {
  await userService.updateProfile(req.userId!, req.body as UpdateProfileInput);
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
  });
});

export const deleteProfile: RequestHandler = catchAsync(async (req, res) => {
  await userService.deleteProfile(req.userId!);
  res.json({
    success: true,
    message: 'User Deleted Successfully',
  });
});

export const searchUser: RequestHandler = catchAsync(async (req, res) => {
  const name = typeof req.query.name === 'string' ? req.query.name : '';
  const data = await userService.searchUsers(req.userId!, name);
  res.status(200).json({ success: true, data });
});
