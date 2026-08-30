import { S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

/**
 * S3-compatible client pointed at Cloudflare R2.
 * Re-used for presigned PUTs (upload), HeadObject (commit verification),
 * server-side PutObject (avatars), and DeleteObject(s) (cleanup).
 *
 * requestHandler timeouts prevent a hung R2 connection from blocking
 * a Node.js request handler indefinitely.
 */
export const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY,
  },
  requestHandler: {
    connectionTimeout: 3_000,
    requestTimeout: 30_000,
  },
});
