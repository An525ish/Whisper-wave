import type { HelmetOptions } from 'helmet';
import helmet from 'helmet';
import { env } from './env.js';
import { adsConfigured } from '../services/ads.js';

/** R2 presigned PUT URLs hit the bucket-specific or account S3 endpoint. */
const r2ConnectOrigins = [
  `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  `https://${env.R2_BUCKET}.${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
];

const turnstileOrigin = 'https://challenges.cloudflare.com';

// Razorpay Checkout: script from checkout.razorpay.com, its iframe + calls to api.razorpay.com.
const razorpayScript = 'https://checkout.razorpay.com';
const razorpayApi = 'https://api.razorpay.com';
const razorpayEvents = 'https://lumberjack.razorpay.com';

const imageKitOrigin = new URL(env.IMAGEKIT_URL_ENDPOINT).origin;

/**
 * AdSense origins. Added to the CSP ONLY when ads are configured, so a deploy
 * without ads keeps a closed policy and can never load an ad script by accident.
 */
const ads = adsConfigured();
const adScript = ads
  ? ['https://pagead2.googlesyndication.com', 'https://*.googlesyndication.com', 'https://adservice.google.com', 'https://www.googletagservices.com']
  : [];
const adFrame = ads
  ? ['https://googleads.g.doubleclick.net', 'https://*.googlesyndication.com', 'https://tpc.googlesyndication.com', 'https://www.google.com']
  : [];
const adConnect = ads
  ? ['https://pagead2.googlesyndication.com', 'https://*.googlesyndication.com', 'https://ep1.adtrafficquality.google', 'https://*.adtrafficquality.google']
  : [];

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
      'script-src': ["'self'", 'https://accounts.google.com', turnstileOrigin, razorpayScript, ...adScript],
      'script-src-elem': ["'self'", 'https://accounts.google.com', turnstileOrigin, razorpayScript, ...adScript],
      // `/apps` embeds maker apps (e.g. Whispr). Those origins must be listed — `'self'`
      // only covers this server's own origin, not a sibling site on another host.
      'frame-src': ["'self'", 'https://accounts.google.com', turnstileOrigin, razorpayScript, razorpayApi, ...adFrame, ...appFrameOrigins],
      'connect-src': [
        "'self'",
        ...r2ConnectOrigins,
        // ImageKit — fetch() for media download in gallery / attachments
        imageKitOrigin,
        'https://ik.imagekit.io',
        'https://accounts.google.com',
        turnstileOrigin,
        razorpayApi,
        razorpayEvents,
        ...adConnect,
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
