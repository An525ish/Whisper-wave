import type { StoredIdentity } from '../types';

/**
 * A returning guest's anonymous identity, kept in `localStorage` so they don't
 * retype an alias every visit.
 *
 * This is deliberately *not* a credential. The `anonId` that actually
 * authorises a session is an httpOnly cookie the client cannot read, and the
 * rules forbid tokens in `localStorage` — nothing here grants access to
 * anything. Worst case it is cleared and the guest picks a new alias.
 */
const STORAGE_KEY = 'whisper:identity';

const EMPTY: StoredIdentity = { displayName: '', vibeTags: [], gender: 'prefer_not_to_say' };

/**
 * Storage is scoped per account when there is one.
 *
 * Two accounts on one device are a real case — someone testing, or sharing a
 * machine — and a single flat key let account B inherit account A's alias, which
 * is both wrong and mildly identifying: the alias is what a partner sees, so
 * leaking it across accounts is exactly the cross-account leak this feature is
 * meant to avoid. Guests keep the bare key, so existing saved aliases survive.
 */
const keyFor = (accountId?: string): string =>
  accountId ? `${STORAGE_KEY}:${accountId}` : STORAGE_KEY;

/**
 * Read the saved identity. Returns `null` when absent, unparseable, or not an
 * object — a corrupt entry must degrade to "no saved identity", never throw
 * during boot.
 */
export const readStoredIdentity = (accountId?: string): StoredIdentity | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(keyFor(accountId));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;

    const candidate = parsed as Partial<StoredIdentity>;
    if (typeof candidate.displayName !== 'string' || !candidate.displayName.trim()) {
      return null;
    }

    return {
      displayName: candidate.displayName,
      vibeTags: Array.isArray(candidate.vibeTags)
        ? candidate.vibeTags.filter((t): t is string => typeof t === 'string')
        : [],
      gender: candidate.gender ?? EMPTY.gender,
    };
  } catch {
    // Private-mode Safari and disabled storage both throw on access. Treat the
    // identity as simply not saved.
    return null;
  }
};

/** Persist the identity. Silently no-ops when storage is unavailable. */
export const writeStoredIdentity = (identity: StoredIdentity, accountId?: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(keyFor(accountId), JSON.stringify(identity));
  } catch {
    // Quota or private mode — the identity simply won't survive a reload.
  }
};

/** Forget the saved identity (the panel's "not now" path). */
export const clearStoredIdentity = (accountId?: string): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(keyFor(accountId));
  } catch {
    // Nothing to do — it was never stored.
  }
};