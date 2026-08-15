/**
 * Known mailbox hosts allowed for signup / profile email.
 * Temp-mail and unknown domains are rejected by `isAllowedEmail`.
 */
export const ALLOWED_EMAIL_DOMAINS = [
  // Google
  'gmail.com',
  'googlemail.com',

  // Microsoft
  'outlook.com',
  'hotmail.com',
  'hotmail.co.uk',
  'hotmail.fr',
  'hotmail.de',
  'hotmail.it',
  'hotmail.es',
  'live.com',
  'live.co.uk',
  'msn.com',

  // Yahoo
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.co.in',
  'yahoo.co.jp',
  'yahoo.fr',
  'yahoo.de',
  'yahoo.es',
  'yahoo.it',
  'yahoo.ca',
  'yahoo.com.au',
  'yahoo.com.br',
  'ymail.com',
  'rocketmail.com',

  // Apple
  'icloud.com',
  'me.com',
  'mac.com',

  // Proton
  'proton.me',
  'protonmail.com',
  'pm.me',

  // Other major providers
  'aol.com',
  'zoho.com',
  'zohomail.com',
  'gmx.com',
  'gmx.net',
  'gmx.de',
  'mail.com',
  'fastmail.com',
  'fastmail.fm',
  'tutanota.com',
  'tuta.com',
  'hey.com',
] as const;
