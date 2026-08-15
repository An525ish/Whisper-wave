/** Common disposable / temporary mailbox providers. Not exhaustive — OTP is the real gate. */
const DISPOSABLE_DOMAINS = new Set(
  [
    'mailinator.com',
    'guerrillamail.com',
    'guerrillamail.net',
    'sharklasers.com',
    'grr.la',
    'guerrillamailblock.com',
    'pokemail.net',
    'spam4.me',
    'tempmail.com',
    'temp-mail.org',
    'temp-mail.io',
    'tmpmail.org',
    'tmpmail.net',
    '10minutemail.com',
    '10minutemail.net',
    'throwaway.email',
    'yopmail.com',
    'yopmail.fr',
    'trashmail.com',
    'trashmail.me',
    'fakeinbox.com',
    'maildrop.cc',
    'dispostable.com',
    'mailnesia.com',
    'getnada.com',
    'nada.email',
    'emailondeck.com',
    'mintemail.com',
    'moakt.com',
    'tempail.com',
    'discard.email',
    'mailcatch.com',
    'mytemp.email',
    'tmpeml.com',
    'inboxkitten.com',
    'mailnull.com',
    'spamgourmet.com',
    'mailinator.net',
    'mailinator.org',
  ].map((d) => d.toLowerCase())
);

export const getEmailDomain = (email: string): string => {
  const at = email.lastIndexOf('@');
  if (at < 0) return '';
  return email.slice(at + 1).toLowerCase().trim();
};

export const isDisposableEmail = (email: string): boolean => {
  const domain = getEmailDomain(email);
  if (!domain) return true;
  if (DISPOSABLE_DOMAINS.has(domain)) return true;
  // block obvious subdomains of known disposable hosts
  for (const blocked of DISPOSABLE_DOMAINS) {
    if (domain.endsWith(`.${blocked}`)) return true;
  }
  return false;
};
