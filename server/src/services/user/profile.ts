import * as userRepo from '../../repositories/user.js';
import type { UpdateProfileInput } from '../../validators/request.js';
import type { PublicUser, UpdateUserPatch } from '../../types/index.js';
import type { UploadableFile } from '../../types/message.js';
import { AppError } from '../../utils/AppError.js';
import { uploadAvatarFromFile } from '../../utils/avatar.js';
import { deleteFromR2 } from '../../utils/storage.js';
import { toPublicUser } from './shared.js';

export const getProfile = async (
  userId: string
): Promise<PublicUser & Record<string, unknown>> => {
  const user = await userRepo.findByIdLean(userId);

  if (!user) {
    throw new AppError(404, 'No user found in the database');
  }

  return toPublicUser(user);
};

export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput,
  avatarFile?: UploadableFile
): Promise<PublicUser & Record<string, unknown>> => {
  const user = await userRepo.findByIdLean(userId);
  if (!user) {
    throw new AppError(404, 'User not found in the database');
  }

  const patch: UpdateUserPatch = {};

  if (input.name) patch.name = input.name;
  if (input.bio !== undefined) patch.bio = input.bio;

  if (avatarFile) {
    patch.avatar = await uploadAvatarFromFile(avatarFile);
  }

  if (Object.keys(patch).length === 0) {
    throw new AppError(400, 'No profile fields to update');
  }

  const updatedUser = (await userRepo.updateById(userId, patch))!;

  if (avatarFile && user.avatar?.publicId) {
    await deleteFromR2(user.avatar.publicId);
  }

  return toPublicUser(updatedUser);
};

export const deleteProfile = async (userId: string): Promise<void> => {
  const isUserDeleted = await userRepo.deleteById(userId);
  if (!isUserDeleted) {
    throw new AppError(404, 'User not found');
  }
};
