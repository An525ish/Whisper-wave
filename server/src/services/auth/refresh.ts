import * as refreshTokenRepo from '../../repositories/refreshToken.js';
import { AppError } from '../../utils/AppError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  REFRESH_TOKEN_TTL_MS,
} from '../../utils/token.js';
import { sha256 } from './shared.js';

/**
 * Validates the refresh token cookie, issues a new access token, and rotates
 * the refresh token. The old hash is claimed (findOneAndDelete) before the new
 * one is stored — only one concurrent refresh can succeed per token.
 */
export const refreshAccessToken = async (
  cookieRefreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const tokenHash = sha256(cookieRefreshToken);
  const stored = await refreshTokenRepo.claimByHash(tokenHash);

  if (!stored) {
    throw new AppError(401, 'Session expired. Please sign in again.');
  }

  const userId = stored.userId.toString();
  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  await refreshTokenRepo.create(userId, sha256(newRefreshToken), expiresAt);

  return {
    accessToken: generateAccessToken(userId),
    refreshToken: newRefreshToken,
  };
};
