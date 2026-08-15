import { v4 as uuid } from 'uuid';
import { cloudinary } from '../config/cloudinary.js';
import type { CloudinaryUploadResult, UploadableFile } from '../types/message.js';
import { getBase64 } from './helper.js';
import { logger } from './logger.js';

export type { CloudinaryUploadResult };

export const uploadToCloudinary = async (
  files: UploadableFile[] = []
): Promise<CloudinaryUploadResult[]> => {
  try {
    const uploadPromises = files.map(
      (file) =>
        new Promise<CloudinaryUploadResult>((resolve, reject) => {
          cloudinary.uploader.upload(
            getBase64(file),
            {
              resource_type: 'auto',
              public_id: uuid(),
              filename_override: file.originalname,
            },
            (error, result) => {
              if (error || !result) return reject(error ?? new Error('Upload failed'));
              resolve({
                publicId: result.public_id,
                url: result.secure_url,
                name: file.originalname,
                fileType: file.fileType ?? 'document',
              });
            }
          );
        })
    );

    return await Promise.all(uploadPromises);
  } catch (error) {
    logger.error({ err: error }, 'Cloudinary upload failed');
    throw new Error('Failed to upload files to Cloudinary');
  }
};

/** Upload a remote image URL directly to Cloudinary (used for OAuth avatars). */
export const uploadUrlToCloudinary = async (
  url: string
): Promise<{ publicId: string; url: string }> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader.upload(
      url,
      { resource_type: 'image', public_id: uuid() },
      (error, result) => {
        if (error || !result) {
          return reject(error ?? new Error('Cloudinary URL upload failed'));
        }
        resolve({ publicId: result.public_id, url: result.secure_url });
      }
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
