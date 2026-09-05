import type { RequestHandler } from 'express';
import type { ValidatedRequest } from '../middlewares/validate.js';
import { userService } from '../services/index.js';
import type { SearchUserQuery, UpdateProfileInput } from '../validators/request.js';
import type { UploadableFile } from '../types/message.js';
import { catchAsync } from '../utils/catchAsync.js';

export const getProfile: RequestHandler = catchAsync(async (req, res) => {
  const user = await userService.getProfile(req.userId!);
  res.status(200).json({
    success: true,
    user,
    isImpersonated: req.isImpersonated ?? false,
  });
});

export const updateProfile: RequestHandler = catchAsync(async (req, res) => {
  const user = await userService.updateProfile(
    req.userId!,
    req.body as UpdateProfileInput,
    req.file as UploadableFile | undefined
  );
  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user,
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
  const { name } = (req as ValidatedRequest<SearchUserQuery>).validatedQuery;
  const data = await userService.searchUsers(req.userId!, name);
  res.status(200).json({ success: true, data });
});
