import type { RequestHandler } from 'express';
import { cookieOptions } from '../config/cors.js';
import { authService } from '../services/index.js';
import type { UploadableFile } from '../types/message.js';
import { catchAsync } from '../utils/catchAsync.js';
import type {
  ForgotPasswordInput,
  GoogleSignInInput,
  ResetPasswordInput,
  SignInInput,
  SignUpCompleteInput,
  SignUpResendInput,
  SignUpStartInput,
  SignUpVerifyInput,
} from '../validators/auth.js';

export const startSignUp: RequestHandler = catchAsync(async (req, res) => {
  const result = await authService.startSignUp(req.body as SignUpStartInput);

  res.status(200).json({
    success: true,
    message: result.message,
    data: { email: result.email },
  });
});

export const resendSignUpOtp: RequestHandler = catchAsync(async (req, res) => {
  const result = await authService.resendSignUpOtp(
    req.body as SignUpResendInput
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const verifySignUpOtp: RequestHandler = catchAsync(async (req, res) => {
  const result = await authService.verifySignUpOtp(
    req.body as SignUpVerifyInput
  );

  res.status(200).json({
    success: true,
    message: result.message,
    data: { signupToken: result.signupToken },
  });
});

export const completeSignUp: RequestHandler = catchAsync(async (req, res) => {
  const result = await authService.completeSignUp(
    req.body as SignUpCompleteInput,
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

export const forgotPassword: RequestHandler = catchAsync(async (req, res) => {
  const result = await authService.forgotPassword(
    req.body as ForgotPasswordInput
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const resetPassword: RequestHandler = catchAsync(async (req, res) => {
  const result = await authService.resetPassword(
    req.body as ResetPasswordInput
  );

  res.status(200).json({
    success: true,
    message: result.message,
  });
});

export const googleSignIn: RequestHandler = catchAsync(async (req, res) => {
  const result = await authService.googleSignIn(
    req.body as GoogleSignInInput
  );

  res
    .status(200)
    .cookie('accessToken', result.token, cookieOptions)
    .json({
      success: true,
      message: result.message,
      data: result.user,
    });
});
