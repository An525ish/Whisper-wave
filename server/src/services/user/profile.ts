import { compare, hash } from 'bcrypt';
import * as userRepo from '../../repositories/user.js';
import type { PublicUser, UpdateProfileInput, UpdateUserPatch } from '../../types/index.js';
import type { UploadableFile } from '../../types/message.js';
import { AppError } from '../../utils/AppError.js';
import { uploadAvatarFromFile } from '../../utils/avatar.js';
import { deleteFromR2 } from '../../utils/storage.js';
import { normalizeEmail } from '../../utils/normalize.js';
import { isAllowedEmail } from '../../utils/disposableEmail.js';

export const getProfile = async (
  userId: string
): Promise<PublicUser & Record<string, unknown>> => {
  const user = await userRepo.findByIdLean(userId);

  if (!user) {
    throw new AppError(404, 'No user found in the database');
  }

  return {
    ...user,
    _id: user._id as PublicUser['_id'],
    avatar: user.avatar.url,
  };
};

export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput,
  avatarFile?: UploadableFile
): Promise<PublicUser & Record<string, unknown>> => {
  const user = await userRepo.findByIdWithPassword(userId);
  if (!user) {
    throw new AppError(404, 'User not found in the database');
  }

  const patch: UpdateUserPatch = {};

  if (input.oldPassword && input.newPassword) {
    const isMatch = await compare(input.oldPassword, user.password);
    if (!isMatch) {
      throw new AppError(400, 'Old password is incorrect');
    }
    patch.password = await hash(input.newPassword, 10);
  }

  if (input.name) patch.name = input.name;
  if (input.username) patch.username = input.username;
  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.email) {
    const email = normalizeEmail(input.email);
    if (!isAllowedEmail(email)) {
      throw new AppError(
        400,
        'Please use a well-known email provider (Gmail, Outlook, Yahoo, iCloud, etc.).'
      );
    }
    const existing = await userRepo.findByEmail(email);
    if (existing && existing._id.toString() !== userId) {
      throw new AppError(409, 'Email already in use');
    }
    patch.email = email;
  }

  if (avatarFile) {
    patch.avatar = await uploadAvatarFromFile(avatarFile);
  } else if (input.avatar) {
    patch.avatar = input.avatar;
  }

  if (Object.keys(patch).length === 0) {
    throw new AppError(400, 'No profile fields to update');
  }

  await userRepo.updateById(userId, patch);

  if (avatarFile && user.avatar?.publicId) {
    await deleteFromR2(user.avatar.publicId);
  }

  return getProfile(userId);
};

export const deleteProfile = async (userId: string): Promise<void> => {
  const deleted = await userRepo.deleteById(userId);
  if (!deleted) {
    throw new AppError(404, 'User not found');
  }
};
