import type { HelmetOptions } from 'helmet';
import helmet from 'helmet';

/** Helmet options — CSP allows Cloudinary, emoji CDN, and Klipy media hosts. */
export const helmetOptions: HelmetOptions = {
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        'https://res.cloudinary.com',
        'https://img.logoipsum.com',
        'https://raw.githubusercontent.com',
        'https://www.google.com',
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
