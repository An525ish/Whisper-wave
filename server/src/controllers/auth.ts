import type { RequestHandler } from 'express';
import { cookieOptions } from '../config/cors.js';
import { authService } from '../services/index.js';
import type { UploadableFile } from '../types/message.js';
import { catchAsync } from '../utils/catchAsync.js';
import type { SignInInput, SignUpInput } from '../validators/auth.js';

export const signUp: RequestHandler = catchAsync(async (req, res) => {
  const result = await authService.signUp(
    req.body as SignUpInput,
    req.file as UploadableFile | undefined
  );

  res
    .status(201)
    .cookie('accessToken', result.token, cookieOptions)
    .json({
      success: true,
      message: result.message,
      data: result.user,
    });
});

export const signIn: RequestHandler = catchAsync(async (req, res) => {
  const result = await authService.signIn(req.body as SignInInput);

  res
    .status(200)
    .cookie('accessToken', result.token, cookieOptions)
    .json({
      success: true,
      message: result.message,
      data: result.user,
    });
});

export const signOut: RequestHandler = catchAsync(async (_req, res) => {
  res
    .status(200)
    .clearCookie('accessToken', cookieOptions)
    .json({
      success: true,
      message: 'User Logged out successfully',
    });
});
