/**
 * Decode the *unverified* payload of a connectToken.
 *
 * This is display copy only — the two aliases shown on the auth screen so the
 * user remembers why they're signing up. It is never an authorisation decision;
 * the server verifies the signature before anything is created. A malformed or
 * missing token simply yields null and the UI shows nothing.
 */
export type TokenAliases = { self?: string; partner?: string };

export const readAliases = (token: string | null): TokenAliases | null => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsed = JSON.parse(json) as { displayName?: string; partnerName?: string };
    if (!parsed.displayName || !parsed.partnerName) return null;
    return { self: parsed.displayName, partner: parsed.partnerName };
  } catch {
    return null;
  }
};
