import type { RequestHandler } from 'express';
import { accessCookieOptions, refreshCookieOptions } from '../config/cors.js';
import type { ValidatedRequest } from '../middlewares/validate.js';
import { authService } from '../services/index.js';
import * as refreshTokenRepo from '../repositories/refreshToken.js';
import * as userRepo from '../repositories/user.js';
import type { UploadableFile } from '../types/message.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sha256 } from '../services/auth/shared.js';
import type {
  ForgotPasswordInput,
  GoogleSignInInput,
  ResetPasswordInput,
  SignInInput,
  SignUpCompleteInput,
  SignUpResendInput,
  SignUpStartInput,
  SignUpUpdateUsernameInput,
  SignUpVerifyInput,
  UsernameCheckQuery,
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

export const updateSignupUsername: RequestHandler = catchAsync(async (req, res) => {
  const result = await authService.updateSignupUsername(
    req.body as SignUpUpdateUsernameInput
  );
  res.status(200).json({ success: true, message: result.message });
});

export const completeSignUp: RequestHandler = catchAsync(async (req, res) => {
  const result = await authService.completeSignUp(
    req.body as SignUpCompleteInput,
    req.file as UploadableFile | undefined
  );

  res
    .status(201)
    .cookie('accessToken', result.accessToken, accessCookieOptions)
    .cookie('refreshToken', result.refreshToken, refreshCookieOptions)
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
    .cookie('accessToken', result.accessToken, accessCookieOptions)
    .cookie('refreshToken', result.refreshToken, refreshCookieOptions)
    .json({
      success: true,
      message: result.message,
      data: result.user,
    });
});

export const refreshToken: RequestHandler = catchAsync(async (req, res) => {
  const cookieRefreshToken = (req.cookies as { refreshToken?: string } | undefined)?.refreshToken;
  if (!cookieRefreshToken) {
    res.status(401).json({ success: false, message: 'No refresh token' });
    return;
  }

  const result = await authService.refreshAccessToken(cookieRefreshToken);

  res
    .status(200)
    .cookie('accessToken', result.accessToken, accessCookieOptions)
    .cookie('refreshToken', result.refreshToken, refreshCookieOptions)
    .json({ success: true });
});

export const signOut: RequestHandler = catchAsync(async (req, res) => {
  const cookieRefreshToken = (req.cookies as { refreshToken?: string } | undefined)?.refreshToken;
  if (cookieRefreshToken) {
    // Best-effort — don't fail sign-out if token is already expired/missing
    await refreshTokenRepo.deleteByHash(sha256(cookieRefreshToken)).catch(() => undefined);
  }

  res
    .status(200)
    .clearCookie('accessToken', accessCookieOptions)
    .clearCookie('refreshToken', { ...refreshCookieOptions, maxAge: 0 })
    .json({ success: true, message: 'User Logged out successfully' });
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

export const checkUsernameAvailability: RequestHandler = catchAsync(async (req, res) => {
  const { username } = (req as ValidatedRequest<UsernameCheckQuery>).validatedQuery;
  const taken = await userRepo.existsByUsername(username);
  res.status(200).json({ success: true, data: { available: !taken } });
});

export const googleSignIn: RequestHandler = catchAsync(async (req, res) => {
  const result = await authService.googleSignIn(
    req.body as GoogleSignInInput
  );

  res
    .status(200)
    .cookie('accessToken', result.accessToken, accessCookieOptions)
    .cookie('refreshToken', result.refreshToken, refreshCookieOptions)
    .json({
      success: true,
      message: result.message,
      data: result.user,
    });
});
