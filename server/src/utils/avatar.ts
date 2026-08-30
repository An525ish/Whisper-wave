import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Jimp, JimpMime } from 'jimp';
import { v4 as uuid } from 'uuid';
import { r2 } from '../config/r2.js';
import { env } from '../config/env.js';
import { DEFAULT_USER_AVATAR } from '../constants/auth.js';
import type { UploadableFile } from '../types/message.js';
import type { UserAvatar } from '../types/user.js';
import { AppError } from './AppError.js';
import { buildDeliveryUrl } from './storage.js';
import { logger } from './logger.js';

const MAX_WIDTH = 400;
const MAX_HEIGHT = 400;

/** Scale image down to fit within bounds without upscaling. */
const scaleToFit = (
  image: { width: number; height: number; resize: (opts: { w: number; h: number }) => unknown },
  maxWidth: number,
  maxHeight: number,
): void => {
  const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  if (ratio >= 1) return;
  image.resize({
    w: Math.max(1, Math.round(image.width * ratio)),
    h: Math.max(1, Math.round(image.height * ratio)),
  });
};

/**
 * Compress an image buffer with Jimp and upload it to R2 as a JPEG.
 * Returns the R2 key and ImageKit delivery URL.
 */
const uploadAvatarBufferToR2 = async (
  buffer: Buffer,
): Promise<UserAvatar> => {
  let compressedBuffer: Buffer;

  try {
    const image = await Jimp.fromBuffer(buffer);
    scaleToFit(image, MAX_WIDTH, MAX_HEIGHT);
    compressedBuffer = Buffer.from(await image.getBuffer(JimpMime.jpeg, { quality: 85 }));
  } catch (err) {
    logger.warn({ err }, 'Jimp compression failed — uploading original buffer');
    // Fall back to original if Jimp can't handle the format (e.g. animated WebP)
    compressedBuffer = buffer;
  }

  const key = `ww/avatars/${uuid()}.jpg`;
  const mimeType = 'image/jpeg';

  await r2.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: key,
      Body: compressedBuffer,
      ContentType: mimeType,
      // Cache avatars aggressively — they rarely change
      CacheControl: 'public, max-age=31536000, immutable',
    }),
  );

  return {
    publicId: key,
    url: buildDeliveryUrl(key, mimeType),
  };
};

/** Upload an avatar file (from multer buffer) to R2 via Jimp compression. */
export const uploadAvatarFromFile = async (avatarFile: UploadableFile): Promise<UserAvatar> => {
  try {
    return await uploadAvatarBufferToR2(avatarFile.buffer);
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error({ err }, 'Avatar file upload to R2 failed');
    throw new AppError(400, 'Failed to upload avatar');
  }
};

/** Signup step 3 — use uploaded file or fall back to the default placeholder. */
export const resolveSignupAvatar = async (avatarFile?: UploadableFile): Promise<UserAvatar> => {
  if (!avatarFile) return { ...DEFAULT_USER_AVATAR };
  return uploadAvatarFromFile(avatarFile);
};

/**
 * Google OAuth — fetch the remote picture URL, compress, and store in R2.
 * Falls back silently to the default avatar on any failure so OAuth signup
 * never breaks because of a transient image fetch/upload error.
 */
export const resolveOAuthAvatar = async (pictureUrl?: string): Promise<UserAvatar> => {
  if (!pictureUrl) return { ...DEFAULT_USER_AVATAR };

  try {
    const response = await fetch(pictureUrl, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return await uploadAvatarBufferToR2(buffer);
  } catch (err) {
    logger.warn({ err, pictureUrl }, 'OAuth avatar fetch/upload failed — using default');
    return { ...DEFAULT_USER_AVATAR };
  }
};
