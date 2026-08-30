import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { cloudinary } from '../../config/cloudinary.js';
import { env } from '../../config/env.js';
import * as chatRepo from '../../repositories/chat.js';
import type { MessageAttachment } from '../../types/message.js';
import type { CommitAttachment, SignUploadInput, SignUploadResult } from '../../types/upload.js';
import { AppError } from '../../utils/AppError.js';

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB
/** Signature TTL: 10-min sign window + 1-min grace period */
const ASSET_MAX_AGE_MS = 11 * 60 * 1000;

const buildPublicId = (chatId: string, userId: string): string =>
  `ww/chats/${chatId}/${userId}/${uuid()}`;

const expectedPrefix = (chatId: string, userId: string): string =>
  `ww/chats/${chatId}/${userId}/`;

/**
 * Cloudinary resource_type from MIME.
 * Note: Cloudinary treats audio as resource_type 'video'.
 */
const cloudinaryResourceType = (mimeType: string): 'image' | 'video' | 'raw' => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) return 'video';
  return 'raw';
};

/** Application-level file type stored in the DB */
const appFileType = (mimeType: string): 'media' | 'document' =>
  mimeType.startsWith('image/') ||
  mimeType.startsWith('video/') ||
  mimeType.startsWith('audio/')
    ? 'media'
    : 'document';

/**
 * Generate per-file signed upload parameters.
 * Verifies the caller is a member of the chat before issuing any signatures.
 * Signature covers public_id + timestamp so the client cannot swap paths.
 */
export const signUploads = async (input: SignUploadInput): Promise<SignUploadResult> => {
  const { userId, chatId, files } = input;

  const chat = await chatRepo.findByIdMembers(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  const isMember = chat.members.some((m) => m.toString() === userId);
  if (!isMember) throw new AppError(403, 'Not a member of this chat');

  const { CLOUDINARY_API_KEY: apiKey, CLOUDINARY_API_SECRET: apiSecret, CLOUDINARY_CLOUD_NAME: cloudName } = env;
  const timestamp = Math.floor(Date.now() / 1000);

  const uploads = files.map(() => {
    const publicId = buildPublicId(chatId, userId);
    // Cloudinary signature: SHA-1( sorted_params_string + apiSecret )
    const paramsString = `public_id=${publicId}&timestamp=${timestamp}`;
    const signature = crypto.createHash('sha1').update(paramsString + apiSecret).digest('hex');
    return { publicId, signature, timestamp, apiKey, cloudName };
  });

  return { uploads };
};

/**
 * Verify a committed attachment after direct upload:
 * 1. publicId path matches ww/chats/{chatId}/{userId}/
 * 2. Asset exists on Cloudinary (not spoofed)
 * 3. Uploaded within the allowed time window (prevents reuse of old publicIds)
 * 4. Within the 50 MB size cap
 *
 * NOTE: Each call consumes one Cloudinary Management API credit.
 * Cache verified publicIds in Redis when request volume is high.
 */
export const verifyAndNormalizeAttachment = async (
  attachment: CommitAttachment,
  userId: string,
  chatId: string,
): Promise<MessageAttachment> => {
  const { publicId, originalName, mimeType } = attachment;

  if (!publicId.startsWith(expectedPrefix(chatId, userId))) {
    throw new AppError(403, `Invalid attachment: path mismatch for ${publicId}`);
  }

  const resourceType = cloudinaryResourceType(mimeType);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let resource: any;
  try {
    resource = await cloudinary.api.resource(publicId, { resource_type: resourceType });
  } catch {
    throw new AppError(400, 'Attachment not found — upload may have failed or timed out');
  }

  const uploadedAt = new Date(resource.created_at as string).getTime();
  if (Date.now() - uploadedAt > ASSET_MAX_AGE_MS) {
    throw new AppError(400, 'Upload session expired — please re-upload your files');
  }

  if ((resource.bytes as number) > MAX_FILE_SIZE_BYTES) {
    throw new AppError(400, `File "${originalName}" exceeds the 50 MB size limit`);
  }

  return {
    publicId: resource.public_id as string,
    url: resource.secure_url as string,
    name: originalName,
    fileType: appFileType(mimeType),
  };
};
