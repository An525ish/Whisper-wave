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
 * the refresh token (old hash deleted, new one stored). Rotation means a
 * stolen refresh token can only be used once before it's invalidated.
 */
export const refreshAccessToken = async (
  rawRefreshToken: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const tokenHash = sha256(rawRefreshToken);
  const stored = await refreshTokenRepo.findByHash(tokenHash);

  if (!stored) {
    throw new AppError(401, 'Session expired. Please sign in again.');
  }

  const newRefreshToken = generateRefreshToken();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  // Rotate atomically — old token deleted, new token stored
  await Promise.all([
    refreshTokenRepo.deleteByHash(tokenHash),
    refreshTokenRepo.create(stored.userId.toString(), sha256(newRefreshToken), expiresAt),
  ]);

  return {
    accessToken: generateAccessToken(stored.userId.toString()),
    refreshToken: newRefreshToken,
  };
};
