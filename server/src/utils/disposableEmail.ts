import { ALLOWED_EMAIL_DOMAINS } from '../constants/email.js';

const allowedDomainSet = new Set<string>(
  ALLOWED_EMAIL_DOMAINS.map((d) => d.toLowerCase())
);

export const getEmailDomain = (email: string): string => {
  const at = email.lastIndexOf('@');
  if (at < 0) return '';
  return email.slice(at + 1).toLowerCase().trim();
};

/** True when the address uses an allowlisted provider. */
export const isAllowedEmail = (email: string): boolean => {
  const domain = getEmailDomain(email);
  if (!domain) return false;
  if (allowedDomainSet.has(domain)) return true;
  for (const allowed of allowedDomainSet) {
    if (domain.endsWith(`.${allowed}`)) return true;
  }
  return false;
};

/** True when the address is NOT on the allowlist (temp / unknown host). */
export const isDisposableEmail = (email: string): boolean => !isAllowedEmail(email);
