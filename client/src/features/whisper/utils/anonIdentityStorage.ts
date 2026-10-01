import type { Gender, VibeTag } from '../types';

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

export type StoredIdentity = {
  displayName: string;
  vibeTags: VibeTag[];
  gender: Gender;
};

const EMPTY: StoredIdentity = { displayName: '', vibeTags: [], gender: 'prefer_not_to_say' };

/**
 * Read the saved identity. Returns `null` when absent, unparseable, or not an
 * object — a corrupt entry must degrade to "no saved identity", never throw
 * during boot.
 */
export const readStoredIdentity = (): StoredIdentity | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
        ? candidate.vibeTags.filter((t): t is VibeTag => typeof t === 'string')
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
export const writeStoredIdentity = (identity: StoredIdentity): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Quota or private mode — the identity simply won't survive a reload.
  }
};

/** Forget the saved identity (the panel's "not now" path). */
export const clearStoredIdentity = (): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to do — it was never stored.
  }
};