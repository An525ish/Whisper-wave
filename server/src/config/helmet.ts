import type { HelmetOptions } from 'helmet';
import helmet from 'helmet';
import { env } from './env.js';

/** R2 presigned PUT URLs hit the bucket-specific or account S3 endpoint. */
const r2ConnectOrigins = [
  `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  `https://${env.R2_BUCKET}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
];

const turnstileOrigin = 'https://challenges.cloudflare.com';

const imageKitOrigin = new URL(env.IMAGEKIT_URL_ENDPOINT).origin;

/** Origins `/apps` may iframe — from FRAME_SRC_ORIGINS (comma-separated full origins). */
const appFrameOrigins = env.FRAME_SRC_ORIGINS.split(',')
  .map((s) => s.trim())
  .filter(Boolean)
  .map((raw) => {
    try {
      return new URL(raw).origin;
    } catch {
      return '';
    }
  })
  .filter(Boolean);

/**
 * Helmet options — CSP allows ImageKit CDN, Klipy, Google Identity Services and Cloudflare Turnstile.
 * COOP uses same-origin-allow-popups so the Google OAuth popup can talk to the opener.
 */
export const helmetOptions: HelmetOptions = {
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      // challenges.cloudflare.com: Turnstile (guest first-post check in Rooms) loads its script + iframe from there.
      'script-src': ["'self'", 'https://accounts.google.com', turnstileOrigin],
      'script-src-elem': ["'self'", 'https://accounts.google.com', turnstileOrigin],
      // `/apps` embeds maker apps (e.g. Whispr). Those origins must be listed — `'self'`
      // only covers this server's own origin, not a sibling site on another host.
      'frame-src': ["'self'", 'https://accounts.google.com', turnstileOrigin, ...appFrameOrigins],
      'connect-src': [
        "'self'",
        ...r2ConnectOrigins,
        // ImageKit — fetch() for media download in gallery / attachments
        imageKitOrigin,
        'https://ik.imagekit.io',
        'https://accounts.google.com',
        turnstileOrigin,
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
        // Google favicon service (S2 redirects to t3.gstatic.com)
        'https://t3.gstatic.com',
        // emoji-picker-react (facebook emoji sheet)
        'https://cdn.jsdelivr.net',
        // Klipy GIF / meme CDN
        'https://static.klipy.com',
        // Faker.js seeded test-data avatars — dev/staging only
        'https://cloudflare-ipfs.com',
        // OG preview images — any HTTPS origin (link previews in composer)
        'https:',
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
