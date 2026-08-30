import { v4 as uuid } from 'uuid';
import { cloudinary } from '../config/cloudinary.js';
import { DEFAULT_USER_AVATAR } from '../constants/auth.js';
import type { UploadableFile } from '../types/message.js';
import type { UserAvatar } from '../types/user.js';
import { AppError } from './AppError.js';
import { uploadUrlToCloudinary } from './cloudinary.js';
import { getBase64 } from './helper.js';

/** Upload a single avatar file to Cloudinary (server-side, multer buffer). */
const uploadAvatarFileToCloudinary = (file: UploadableFile): Promise<UserAvatar> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      getBase64(file),
      { resource_type: 'image', public_id: `ww/avatars/${uuid()}` },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error('Avatar upload failed'));
        resolve({ publicId: result.public_id, url: result.secure_url });
      },
    );
  });

export const uploadAvatarFromFile = async (
  avatarFile: UploadableFile
): Promise<UserAvatar> => {
  try {
    return await uploadAvatarFileToCloudinary(avatarFile);
  } catch {
    throw new AppError(400, 'Failed to upload avatar');
  }
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
