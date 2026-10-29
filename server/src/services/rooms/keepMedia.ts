import { CopyObjectCommand } from '@aws-sdk/client-s3';
import { r2 } from '../../config/r2.js';
import { env } from '../../config/env.js';
import { AnonImage } from '../../models/anonImage.js';
import { logger } from '../../utils/logger.js';
import { buildDeliveryUrl } from '../../utils/storage.js';

/**
 * Copy a reported room photo out of the room's ephemeral prefix so it outlives
 * the instance. The copy lands under `ww/kept/rooms/{slug}/` and gets a row the
 * admin panel lists and deletes (same page as anon photos). Returns the kept
 * URL, or null when the copy failed (the report is still filed, without the photo).
 */
export const keepRoomImage = async (key: string, slug: string, instanceId: string): Promise<string | null> => {
  const keptKey = `ww/kept/rooms/${slug}/${key.split('/').pop()}`;
  try {
    await r2.send(
      new CopyObjectCommand({
        Bucket: env.R2_BUCKET,
        CopySource: `${env.R2_BUCKET}/${key}`,
        Key: keptKey,
      })
    );
    const url = buildDeliveryUrl(keptKey, 'image/jpeg');
    await AnonImage.updateOne(
      { key: keptKey },
      { $setOnInsert: { key: keptKey, url, sessionId: instanceId, anonId: 'room', source: 'room', roomSlug: slug } },
      { upsert: true }
    );
    return url;
  } catch (err) {
    logger.warn({ err, key }, 'Could not keep reported room photo');
    return null;
  }
};
