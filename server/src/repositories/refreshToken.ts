import { RefreshToken } from '../models/refreshToken.js';

export const create = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<void> => {
  await RefreshToken.create({ userId, tokenHash, expiresAt });
};

export const findByHash = async (tokenHash: string) =>
  RefreshToken.findOne({ tokenHash, expiresAt: { $gt: new Date() } }).lean();

/** Atomically validate + delete — only one refresh request can claim a token. */
export const claimByHash = async (tokenHash: string) =>
  RefreshToken.findOneAndDelete({
    tokenHash,
    expiresAt: { $gt: new Date() },
  }).lean();

export const deleteByHash = async (tokenHash: string): Promise<void> => {
  await RefreshToken.deleteOne({ tokenHash });
};

/** Used by sign-out-all-devices (future). */
export const deleteAllForUser = async (userId: string): Promise<void> => {
  await RefreshToken.deleteMany({ userId });
};
