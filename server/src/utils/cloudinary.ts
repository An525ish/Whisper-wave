import { v4 as uuid } from 'uuid';
import { cloudinary } from '../config/cloudinary.js';
import { logger } from './logger.js';

/**
 * Upload a remote image URL to Cloudinary (used for OAuth avatar imports).
 * This is the only remaining server-side Cloudinary upload path.
 * Message attachments now use direct client-to-Cloudinary upload — see services/upload/index.ts.
 */
export const uploadUrlToCloudinary = async (
  url: string,
): Promise<{ publicId: string; url: string }> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      url,
      { resource_type: 'image', public_id: `ww/avatars/${uuid()}` },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error('Cloudinary URL upload failed'));
        }
        resolve({ publicId: result.public_id, url: result.secure_url });
      },
    );
  });

export const deleteFromCloudinary = async (publicIds: string[]): Promise<void> => {
  if (publicIds.length === 0) return;
  try {
    await cloudinary.api.delete_resources(publicIds);
  } catch (error) {
    logger.error({ err: error }, 'Cloudinary delete failed');
  }
};
