import type { HelmetOptions } from 'helmet';
import helmet from 'helmet';
import { env } from './env.js';

/** R2 presigned PUT URLs hit the bucket-specific or account S3 endpoint. */
const r2ConnectOrigins = [
  `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  `https://${env.R2_BUCKET}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
];

const imageKitOrigin = new URL(env.IMAGEKIT_URL_ENDPOINT).origin;

/**
 * Helmet options — CSP allows ImageKit CDN, Klipy, and Google Identity Services.
 * COOP uses same-origin-allow-popups so the Google OAuth popup can talk to the opener.
 */
export const helmetOptions: HelmetOptions = {
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'script-src': ["'self'", 'https://accounts.google.com'],
      'script-src-elem': ["'self'", 'https://accounts.google.com'],
      'frame-src': ["'self'", 'https://accounts.google.com'],
      'connect-src': [
        "'self'",
        ...r2ConnectOrigins,
        'https://accounts.google.com',
        'https://oauth2.googleapis.com',
        'https://www.googleapis.com',
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        // ImageKit CDN — serves images, avatars and document thumbnails from R2
        imageKitOrigin,
        'https://ik.imagekit.io',
        'https://img.logoipsum.com',
        'https://raw.githubusercontent.com',
        // GitHub user avatars
        'https://avatars.githubusercontent.com',
        'https://www.google.com',
        'https://*.googleusercontent.com',
        // emoji-picker-react (facebook emoji sheet)
        'https://cdn.jsdelivr.net',
        // Klipy GIF / meme CDN
        'https://static.klipy.com',
        // Faker.js seeded test-data avatars — dev/staging only
        'https://cloudflare-ipfs.com',
      ],
      'media-src': [
        "'self'",
        'blob:',
        // ImageKit CDN — audio and video delivered from R2
        imageKitOrigin,
        'https://ik.imagekit.io',
        'https://static.klipy.com',
      ],
    },
  },
};
