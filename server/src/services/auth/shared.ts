import { createHash, randomInt } from 'node:crypto';
import type { Types } from 'mongoose';
import type { AuthResult, PublicUser } from '../../types/user.js';
import { AppError } from '../../utils/AppError.js';
import { isAllowedEmail } from '../../utils/disposableEmail.js';
import { isMailConfigured } from '../../utils/mail.js';
import { isProd } from '../../config/env.js';
import { OTP_TTL_MS } from '../../constants/auth.js';
import * as refreshTokenRepo from '../../repositories/refreshToken.js';
import { generateAccessToken, generateRefreshToken, REFRESH_TOKEN_TTL_MS } from '../../utils/token.js';

export const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

export const toPublicUser = (user: {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email?: string;
  avatar: { url: string };
  bio?: string;
}): PublicUser & Record<string, unknown> => ({
  _id: user._id,
  name: user.name,
  username: user.username,
  email: user.email,
  avatar: user.avatar.url,
  bio: user.bio,
});

export const assertMailReady = (): void => {
  if (isProd && !isMailConfigured()) {
    throw new AppError(
      503,
      'Email delivery is not configured. Cannot verify signup.'
    );
  }
};

export const assertAcceptableEmail = (email: string): void => {
  if (!isAllowedEmail(email)) {
    throw new AppError(
      400,
      'Please use a well-known email provider (Gmail, Outlook, Yahoo, iCloud, etc.).'
    );
  }
};

export const issueOtp = (): { otp: string; otpHash: string; otpExpiresAt: Date } => {
  const otp = String(randomInt(100000, 1000000));
  return {
    otp,
    otpHash: sha256(otp),
    otpExpiresAt: new Date(Date.now() + OTP_TTL_MS),
  };
};

/**
 * Issues an access token (JWT, 15 min) and a refresh token (opaque random,
 * 7 days stored hashed in DB). Returns both raw strings — callers set them as
 * separate httpOnly cookies.
 */
export const issueAuthTokens = async (
  userId: string
): Promise<Pick<AuthResult, 'accessToken' | 'refreshToken'>> => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await refreshTokenRepo.create(userId, sha256(refreshToken), expiresAt);
  return { accessToken, refreshToken };
};

type AuthSessionUser = Parameters<typeof toPublicUser>[0];

/** Issues tokens and returns the standard auth payload (cookies + JSON user). */
export const issueAuthResult = async (
  user: AuthSessionUser,
  message: string
): Promise<AuthResult> => {
  const { accessToken, refreshToken } = await issueAuthTokens(user._id.toString());
  return { accessToken, refreshToken, message, user: toPublicUser(user) };
};
