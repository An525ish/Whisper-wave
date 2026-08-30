import { DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { r2 } from '../config/r2.js';
import { env } from '../config/env.js';
import { logger } from './logger.js';

/**
 * Construct the CDN delivery URL for an R2 object.
 *
 * The raw R2 key is what we persist in the DB (`publicId`).
 * The CDN base is the only thing that changes when migrating providers —
 * swap IMAGEKIT_URL_ENDPOINT to a Cloudinary base URL and update the
 * transformation suffix; no DB migration required.
 *
 * Image optimization via ImageKit URL transforms:
 *   f-auto  → serve WebP/AVIF based on Accept header
 *   q-auto  → quality chosen by ImageKit's perceptual model
 *
 * Audio, video, and documents are passed through as-is (ImageKit CDN
 * caches and delivers them without modification).
 */
export const buildDeliveryUrl = (key: string, mimeType: string): string => {
  const base = env.IMAGEKIT_URL_ENDPOINT.replace(/\/$/, '');

  if (mimeType.startsWith('image/')) {
    return `${base}/${key}?tr=f-auto,q-auto`;
  }

  // Video, audio, documents — raw delivery, still benefits from Cloudflare edge cache
  return `${base}/${key}`;
};

/**
 * Delete a single R2 object by key.
 * Failures are logged but never thrown — a missing object or transient R2 error
 * should never block the user action that triggered the delete.
 */
export const deleteFromR2 = async (key: string): Promise<void> => {
  if (!key) return;
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
  } catch (err) {
    logger.error({ err, key }, 'R2 delete failed');
  }
};

/**
 * Bulk delete up to 1,000 R2 objects in a single request.
 * Empty arrays are a no-op.
 */
export const deleteManyFromR2 = async (keys: string[]): Promise<void> => {
  if (keys.length === 0) return;
  try {
    await r2.send(
      new DeleteObjectsCommand({
        Bucket: env.R2_BUCKET,
        Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
      }),
    );
  } catch (err) {
    logger.error({ err, keys }, 'R2 bulk delete failed');
  }
};
