import type { HelmetOptions } from 'helmet';
import helmet from 'helmet';

/** Helmet options — CSP allows Cloudinary media and known UI image hosts. */
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
      ],
      'media-src': ["'self'", 'blob:', 'https://res.cloudinary.com'],
    },
  },
};
