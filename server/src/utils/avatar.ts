import { DEFAULT_USER_AVATAR } from '../constants/auth.js';
import type { UploadableFile } from '../types/message.js';
import type { UserAvatar } from '../types/user.js';
import { AppError } from './AppError.js';
import { uploadToCloudinary, uploadUrlToCloudinary } from './cloudinary.js';

export const uploadAvatarFromFile = async (
  avatarFile: UploadableFile
): Promise<UserAvatar> => {
  const uploaded = await uploadToCloudinary([avatarFile]);
  if (!uploaded.length) {
    throw new AppError(400, 'Failed to upload avatar');
  }
  return { publicId: uploaded[0].publicId, url: uploaded[0].url };
};

/** Signup step 3 — uploaded file or default placeholder. */
export const resolveSignupAvatar = async (
  avatarFile?: UploadableFile
): Promise<UserAvatar> => {
  if (!avatarFile) return { ...DEFAULT_USER_AVATAR };
  return uploadAvatarFromFile(avatarFile);
};

/** Google OAuth — remote picture URL with soft fallback to default. */
export const resolveOAuthAvatar = async (pictureUrl?: string): Promise<UserAvatar> => {
  if (!pictureUrl) return { ...DEFAULT_USER_AVATAR };
  try {
    return await uploadUrlToCloudinary(pictureUrl);
  } catch {
    return { ...DEFAULT_USER_AVATAR };
  }
};
