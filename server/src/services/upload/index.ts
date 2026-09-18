import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { r2 } from '../../config/r2.js';
import { env } from '../../config/env.js';
import * as chatRepo from '../../repositories/chat.js';
import { buildDeliveryUrl } from '../../utils/storage.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import type { SignUploadInput, SignUploadResult, CommitAttachment } from '../../types/upload.js';
import type { MessageAttachment } from '../../types/message.js';

/** Presigned URL TTL in seconds. HeadObject check rejects files older than this + 1 min. */
const PRESIGN_TTL_SECONDS = 600; // 10 minutes

/** Maximum allowed object size verified at commit time (must match validators/upload.ts). */
const MAX_BYTES = 20 * 1024 * 1024;        // 20 MB — images, audio, documents
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB — video

/**
 * Derive the app-level fileType from MIME type.
 * Stored on the MessageAttachment and used by the client for rendering decisions.
 */
const fileTypeFromMime = (mimeType: string): string => {
  if (mimeType.startsWith('image/') || mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
    return 'media';
  }
  return 'document';
};

/** Extract file extension from original filename, falling back to mime subtype. */
const extFromName = (name: string, mimeType: string): string => {
  const dotIdx = name.lastIndexOf('.');
  if (dotIdx !== -1 && dotIdx < name.length - 1) {
    return name.slice(dotIdx + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
  }
  return mimeType.split('/')[1]?.split(';')[0] ?? 'bin';
};

/**
 * Issue one presigned PUT URL per file.
 *
 * Security guarantees:
 * - Caller must be a member of the chat (membership verified before signing).
 * - Each key is scoped to `ww/chats/{chatId}/{userId}/{uuid}.{ext}` —
 *   the commit step enforces this prefix so a user can only commit files
 *   they were authorised to upload.
 * - ContentType is locked into the presigned command; R2 rejects a PUT
 *   that sends a different Content-Type header.
 */
export const signUploads = async (input: SignUploadInput): Promise<SignUploadResult> => {
  const { userId, chatId, files } = input;

  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(400, 'Chat not found');

  const isMember = chat.members.some((m) => m.toString() === userId);
  if (!isMember) throw new AppError(403, 'Not a member of this chat');

  const uploads = await Promise.all(
    files.map(async (file) => {
      const ext = extFromName(file.name, file.mimeType);
      const key = `ww/chats/${chatId}/${userId}/${uuid()}.${ext}`;

      const command = new PutObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
        ContentType: file.mimeType,
        // ContentLength cannot be enforced in presigned PUTs (R2 limitation),
        // but size is validated server-side at commit via HeadObject ContentLength.
      });

      const presignedUrl = await getSignedUrl(r2, command, {
        expiresIn: PRESIGN_TTL_SECONDS,
      });

      return { presignedUrl, key, mimeType: file.mimeType };
    }),
  );

  return { uploads };
};

/**
 * Verify a single committed attachment and return a normalised MessageAttachment.
 *
 * Verifications performed:
 * 1. Key prefix matches `ww/chats/{chatId}/{userId}/` — prevents cross-user injection.
 * 2. Object exists in R2 (HeadObject — throws NoSuchKey if not found).
 * 3. ContentLength ≤ 50 MB — guards against client bypassing size limits.
 * 4. LastModified within the last 11 minutes — rejects replayed/stale keys.
 *
 * NOTE: Each call consumes one R2 Class-B operation (equivalent to S3 HeadObject).
 * These are cheap (~$0.004 per 10,000 requests) but consider caching verified keys
 * in Redis (TTL ~2 min) if request volume is high.
 */
export const verifyAndNormalizeAttachment = async (
  attachment: CommitAttachment,
  userId: string,
  chatId: string,
): Promise<MessageAttachment> => {
  const { key, originalName, mimeType } = attachment;

  // 1. Enforce key ownership — key MUST be scoped to this user and chat
  const expectedPrefix = `ww/chats/${chatId}/${userId}/`;
  if (!key.startsWith(expectedPrefix)) {
    throw new AppError(400, 'Invalid attachment key');
  }

  // 2 + 3 + 4. Verify existence, size, and recency via HeadObject
  try {
    const head = await r2.send(
      new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: key }),
    );

    const sizeLimit = mimeType.startsWith('video/') ? MAX_VIDEO_BYTES : MAX_BYTES;
    if ((head.ContentLength ?? 0) > sizeLimit) {
      throw new AppError(400, `Attachment exceeds ${mimeType.startsWith('video/') ? '100' : '20'} MB limit: ${originalName}`);
    }

    const ageMs = Date.now() - (head.LastModified?.getTime() ?? 0);
    const maxAgeMs = (PRESIGN_TTL_SECONDS + 60) * 1000; // 11 minutes
    if (ageMs > maxAgeMs) {
      throw new AppError(400, `Attachment upload has expired: ${originalName}`);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;

    // R2 throws an error with name 'NotFound' or 'NoSuchKey' when object is missing
    const code = (err as { name?: string })?.name;
    if (code === 'NotFound' || code === 'NoSuchKey') {
      throw new AppError(400, `Attachment not found in storage: ${originalName}`);
    }

    logger.error({ err, key }, 'R2 HeadObject failed during commit verification');
    throw new AppError(500, 'Failed to verify attachment');
  }

  return {
    publicId: key,
    url: buildDeliveryUrl(key, mimeType),
    name: originalName,
    fileType: fileTypeFromMime(mimeType),
    ...(attachment.isHd && mimeType.startsWith('image/') ? { isHd: true } : {}),
  };
};
