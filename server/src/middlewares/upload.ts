import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { Jimp, JimpMime } from 'jimp';
import type { UploadableFile } from '../types/message.js';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Explicit allowlist — NOT `image/*`.
 * SVG (`image/svg+xml`) can embed <script> tags and is excluded intentionally.
 * TIFF, BMP, ICO are also excluded: rare in practice, and Jimp may not handle all variants.
 */
const ALLOWED_AVATAR_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const multerAvatar = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_SIZE_BYTES, files: 1 },
  fileFilter(_req, file, cb) {
    if (!ALLOWED_AVATAR_MIME_TYPES.has(file.mimetype)) {
      cb(new Error('Avatar must be a JPEG, PNG, WebP, or GIF'));
      return;
    }
    cb(null, true);
  },
});

const MAX_WIDTH = 400;
const MAX_HEIGHT = 400;

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
 * Multer + Jimp middleware for avatar uploads only.
 * Accepts a single image file, compresses it to JPEG 85% quality at max 400×400,
 * and attaches the result to req.file as an UploadableFile-compatible object.
 *
 * Message attachments are NOT handled here — they go directly from the client to R2
 * via a presigned URL (see services/upload/index.ts).
 */
export const avatarUpload = (req: Request, res: Response, next: NextFunction): void => {
  multerAvatar.single('avatar')(req, res, async (err) => {
    if (err) {
      next(err);
      return;
    }

    if (!req.file) {
      next();
      return;
    }

    try {
      const image = await Jimp.fromBuffer(req.file.buffer);
      scaleToFit(image, MAX_WIDTH, MAX_HEIGHT);
      const compressedBuffer = Buffer.from(
        await image.getBuffer(JimpMime.jpeg, { quality: 85 }),
      );

      // Patch the multer file object so downstream utils (uploadAvatarFromFile) see
      // the compressed buffer and correct MIME type.
      (req.file as Express.Multer.File & Partial<UploadableFile>).buffer = compressedBuffer;
      req.file.mimetype = 'image/jpeg';

      next();
    } catch (error) {
      next(error);
    }
  });
};
