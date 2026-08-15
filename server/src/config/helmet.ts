import type { HelmetOptions } from 'helmet';
import helmet from 'helmet';

/**
 * Helmet options — CSP allows Cloudinary, emoji CDN, Klipy, and Google Identity Services.
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
        'https://accounts.google.com',
        'https://oauth2.googleapis.com',
        'https://www.googleapis.com',
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://res.cloudinary.com',
        'https://img.logoipsum.com',
        'https://raw.githubusercontent.com',
        'https://www.google.com',
        'https://*.googleusercontent.com',
        // emoji-picker-react (facebook emoji sheet)
        'https://cdn.jsdelivr.net',
        // Klipy GIF / meme CDN
        'https://static.klipy.com',
      ],
      'media-src': [
        "'self'",
        'blob:',
        'https://res.cloudinary.com',
        'https://static.klipy.com',
      ],
    },
  },
};
