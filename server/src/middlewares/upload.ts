import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';

const MAX_AVATAR_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

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

/**
 * Multer middleware for avatar uploads only.
 * Validates mime type and buffers the raw file — compression happens in
 * uploadAvatarBufferToR2 (avatar.ts) so it runs exactly once, whether the
 * upload comes from a file upload or OAuth avatar fetch.
 *
 * Message attachments are NOT handled here — they go directly from the client
 * to R2 via a presigned URL (see services/upload/index.ts).
 */
export const avatarUpload = (req: Request, res: Response, next: NextFunction): void => {
  multerAvatar.single('avatar')(req, res, next);
};
