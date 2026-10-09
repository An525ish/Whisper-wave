import type { TokenAliases } from '../types';

/** The claims we read from a connectToken's (unverified) payload. */
type TokenClaims = { displayName?: string; partnerName?: string; exp?: number };

/** base64url → UTF-8 text. `atob` alone mangles multi-byte aliases. */
const decodeBase64Url = (segment: string): string => {
  const binary = atob(segment.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

/**
 * Decode the *unverified* payload of a connectToken.
 *
 * Display copy and a countdown only — never an authorisation decision; the server
 * verifies the signature before anything is created. A malformed or missing token
 * simply yields null and the UI shows nothing.
 */
const readClaims = (token: string | null): TokenClaims | null => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    return JSON.parse(decodeBase64Url(payload)) as TokenClaims;
  } catch {
    return null;
  }
};

/** The two aliases shown on the auth screen so the user remembers why they're signing up. */
export const readAliases = (token: string | null): TokenAliases | null => {
  const claims = readClaims(token);
  if (!claims?.displayName || !claims.partnerName) return null;
  return { self: claims.displayName, partner: claims.partnerName };
};

/** When the token stops being accepted (Unix ms), from its `exp` claim. */
export const readTokenExpiry = (token: string | null): number | null => {
  const exp = readClaims(token)?.exp;
  return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null;
};
