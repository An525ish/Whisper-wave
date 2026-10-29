import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { r2 } from '../../config/r2.js';
import { env } from '../../config/env.js';
import { getRedis } from '../../config/redis.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import { buildDeliveryUrl } from '../../utils/storage.js';
import { ANON_IMAGE_MAX_BYTES } from '../../validators/match.js';
import { AnonImage } from '../../models/anonImage.js';
import { TTL } from './keys.js';
import { requireActiveParticipant } from './pairing.js';

const PRESIGN_TTL_SECONDS = 300;
/** Photos one side may sign per session. A chat, not a file host. */
const MAX_IMAGES_PER_SIDE = 15;

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/** `ww/anon/{sessionId}/{anonId}/` — the only prefix this sender may attach from. */
const prefixFor = (sessionId: string, anonId: string): string => `ww/anon/${sessionId}/${anonId}/`;

/**
 * Presigned PUT for one photo, scoped to the caller's live session.
 *
 * The key embeds sessionId + anonId, so `verifyAnonImage` can later prove the
 * sender uploaded it into THIS chat.
 */
export const signAnonImage = async (
  sessionId: string | null,
  anonId: string,
  mimeType: string
) => {
  const session = await requireActiveParticipant(sessionId ?? undefined, anonId);
  const redis = getRedis();

  const countKey = `match:img-count:${session.sessionId}:${anonId}`;
  const used = await redis.incr(countKey);
  if (used === 1) await redis.expire(countKey, TTL.session);
  if (used > MAX_IMAGES_PER_SIDE) {
    throw new AppError(429, 'You have shared the maximum number of photos in this chat');
  }

  const key = `${prefixFor(session.sessionId, anonId)}${uuid()}.${EXT[mimeType]}`;

  const presignedUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, ContentType: mimeType }),
    { expiresIn: PRESIGN_TTL_SECONDS }
  );
  return { presignedUrl, key, mimeType };
};

/**
 * Confirm the sender really uploaded this key into this session and that the
 * object is a small image, then return the delivery URL.
 * ponytail: trusts R2's stored Content-Type (locked into the presign), no pixel
 * inspection or image moderation. Upgrade: scan on commit if abuse appears.
 */
export const verifyAnonImage = async (
  sessionId: string,
  anonId: string,
  key: string
): Promise<{ key: string; url: string }> => {
  if (!key.startsWith(prefixFor(sessionId, anonId)) || key.includes('..')) {
    throw new AppError(400, 'Photo does not belong to this chat');
  }
  try {
    const head = await r2.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: key }));
    const type = head.ContentType ?? '';
    if (!(type in EXT) || (head.ContentLength ?? 0) > ANON_IMAGE_MAX_BYTES) {
      throw new AppError(400, 'Only photos up to 5 MB can be sent');
    }
    const url = buildDeliveryUrl(key, type);
    // Kept like main-chat media: the admin panel lists it and deletes it (R2 + row).
    // Not removed when the chat ends, so a report can still be reviewed.
    // ponytail: an upload that is signed but never sent is not recorded and stays in R2.
    await AnonImage.updateOne({ key }, { $setOnInsert: { key, url, sessionId, anonId } }, { upsert: true });
    return { key, url };
  } catch (err) {
    if (err instanceof AppError) throw err;
    const code = (err as { name?: string })?.name;
    if (code === 'NotFound' || code === 'NoSuchKey') throw new AppError(400, 'Photo upload did not finish');
    logger.error({ err, key }, 'Anon image verification failed');
    throw new AppError(500, 'Could not check the photo');
  }
};
