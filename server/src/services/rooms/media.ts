import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import { r2 } from '../../config/r2.js';
import { env } from '../../config/env.js';
import { ROOM_IMAGE_MAX_BYTES, ROOM_IMAGE_MIME } from '../../constants/rooms.js';
import { AppError } from '../../utils/AppError.js';
import { logger } from '../../utils/logger.js';
import { buildDeliveryUrl } from '../../utils/storage.js';
import { instances } from './store.js';
import { makeRoomRateLimiter } from './rateLimit.js';
import { ROOM_IMAGE_SIGNS_PER_MIN } from '../../constants/rooms.js';
import { ROOM_ERROR_CODES } from '../../constants/room-events.js';
import type { RoomMedia, RoomMediaKind, RoomMessageInput } from '../../types/room.js';

const PRESIGN_TTL_SECONDS = 300;
const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const signLimiter = makeRoomRateLimiter(ROOM_IMAGE_SIGNS_PER_MIN, 60_000);

/** Room photos live under `ww/rooms/{slug}/{memberKey}/`; the verify step checks this exact prefix. */
const prefixFor = (slug: string, memberKey: string): string => `ww/rooms/${slug}/${memberKey}/`;

/**
 * Who may post media and which kinds. Members only (guests have a gid and a
 * first-post check, not an account to ban), and only kinds the admin enabled
 * for this room. Throws the stable code the namespace forwards.
 */
export const assertMediaAllowed = (
  allowed: readonly RoomMediaKind[] | undefined,
  kind: RoomMediaKind,
  isMember: boolean
): void => {
  if (!isMember || !allowed?.includes(kind)) throw new AppError(403, ROOM_ERROR_CODES.MEDIA_NOT_ALLOWED);
};

/** Presigned PUT for one photo. Every signed key is tracked on the instance so close deletes it. */
export const signRoomImage = async (params: {
  instanceId: string;
  memberKey: string;
  isMember: boolean;
  mimeType: string;
}) => {
  const inst = instances.get(params.instanceId);
  if (!inst) throw new AppError(403, ROOM_ERROR_CODES.NOT_JOINED);
  assertMediaAllowed(inst.media, 'image', params.isMember);
  if (!(ROOM_IMAGE_MIME as readonly string[]).includes(params.mimeType)) {
    throw new AppError(400, ROOM_ERROR_CODES.INVALID_PAYLOAD);
  }
  if (!signLimiter.allow(params.memberKey)) throw new AppError(429, ROOM_ERROR_CODES.RATE_LIMITED);

  const key = `${prefixFor(inst.slug, params.memberKey)}${uuid()}.${EXT[params.mimeType]}`;
  inst.uploads.add(key);
  const presignedUrl = await getSignedUrl(
    r2,
    new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: key, ContentType: params.mimeType }),
    { expiresIn: PRESIGN_TTL_SECONDS }
  );
  return { presignedUrl, key, mimeType: params.mimeType };
};

/**
 * Turn the client's attachment into a stored `RoomMedia`. Images must be a key
 * THIS member signed in THIS room and the object must exist as a small image;
 * links were already host-checked by the socket schema.
 */
export const resolveRoomMedia = async (params: {
  instanceId: string;
  memberKey: string;
  isMember: boolean;
  media: NonNullable<RoomMessageInput['media']>;
}): Promise<RoomMedia> => {
  const inst = instances.get(params.instanceId);
  if (!inst) throw new AppError(403, ROOM_ERROR_CODES.NOT_JOINED);
  const { media } = params;
  assertMediaAllowed(inst.media, media.kind, params.isMember);
  if (media.kind !== 'image') return { kind: media.kind, url: media.url };

  if (!media.key.startsWith(prefixFor(inst.slug, params.memberKey)) || !inst.uploads.has(media.key)) {
    throw new AppError(400, ROOM_ERROR_CODES.MEDIA_FAILED);
  }
  try {
    const head = await r2.send(new HeadObjectCommand({ Bucket: env.R2_BUCKET, Key: media.key }));
    const type = head.ContentType ?? '';
    if (!(type in EXT) || (head.ContentLength ?? 0) > ROOM_IMAGE_MAX_BYTES) {
      throw new AppError(400, ROOM_ERROR_CODES.MEDIA_FAILED);
    }
    return { kind: 'image', key: media.key, url: buildDeliveryUrl(media.key, type) };
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.warn({ err, key: media.key }, 'Room image verification failed');
    throw new AppError(400, ROOM_ERROR_CODES.MEDIA_FAILED);
  }
};
