import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/features/auth';
import { useAnonStore } from '../stores/anonStore';
import {
  clearStoredIdentity,
  readStoredIdentity,
  writeStoredIdentity,
  type StoredIdentity,
} from '../utils/anonIdentityStorage';
import type { Gender, VibeTag } from '../types';

/** How long the "saved" confirmation stays up after an edit. */
const SAVED_HINT_MS = 1600;

/**
 * Read/write the anonymous identity from the panel.
 *
 * Two things this deliberately does NOT do:
 *
 * - **It does not push edits to the server.** The Redis identity card is
 *   overwritten wholesale by `POST /api/match/join` on the next join, so
 *   updating the store is sufficient — there is no endpoint to call and no
 *   round-trip to wait on.
 * - **It does not change who you are mid-thread.** A partner already received
 *   the alias you matched with; silently swapping it would make the header, the
 *   "you" avatar and their view disagree. Edits apply from the *next* match, and
 *   the panel says so.
 *
 * A third, less obvious one: it does **not** derive the alias from the signed-in
 * account. The alias is what the other party sees, so defaulting it to someone's
 * real name would de-anonymise them to a stranger. The account only scopes where
 * the alias is remembered.
 */
export function useAnonIdentity() {
  const displayName = useAnonStore((s) => s.displayName);
  const vibeTags = useAnonStore((s) => s.vibeTags);
  const gender = useAnonStore((s) => s.gender);
  const accountId = useAuthStore((s) => s.user?._id);

  const [remember, setRemember] = useState<boolean>(() => readStoredIdentity(accountId) !== null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  // First visit of a returning guest: restore before they submit the picker.
  useEffect(() => {
    const stored = readStoredIdentity(accountId);
    if (!stored) return;
    const state = useAnonStore.getState();
    if (state.displayName || state.status !== 'idle') return;
    state.setIdentityFields(stored.displayName, stored.vibeTags, stored.gender);
  }, [accountId]);

  // Clear the "Saved" confirmation on its own, without a per-field timer.
  useEffect(() => {
    if (savedAt === null) return;
    const id = window.setTimeout(() => setSavedAt(null), SAVED_HINT_MS);
    return () => window.clearTimeout(id);
  }, [savedAt]);

  const flashSaved = useCallback(() => setSavedAt(Date.now()), []);

  const apply = useCallback(
    (next: Partial<StoredIdentity>, persist: boolean) => {
      const state = useAnonStore.getState();
      const identity: StoredIdentity = {
        displayName: next.displayName ?? state.displayName,
        vibeTags: next.vibeTags ?? state.vibeTags,
        gender: next.gender ?? state.gender,
      };
      state.setIdentityFields(identity.displayName, identity.vibeTags, identity.gender);

      if (persist) writeStoredIdentity(identity, accountId);
      else clearStoredIdentity(accountId);
      setRemember(persist);
      flashSaved();
    },
    [accountId, flashSaved]
  );

  return {
    displayName,
    vibeTags,
    /** `prefer_not_to_say` is the wire value; the picker shows it as "unset". */
    gender: (gender === 'prefer_not_to_say' ? null : gender) as Gender | null,
    remember,
    justSaved: savedAt !== null,
    /** The signed-in account scoping this alias, if any. Null for a guest. */
    accountId: accountId ?? null,
    setAlias: (value: string) => apply({ displayName: value }, remember),
    setTags: (value: VibeTag[]) => apply({ vibeTags: value }, remember),
    setGender: (value: Gender | null) =>
      apply({ gender: value ?? 'prefer_not_to_say' }, remember),
    setRemember: (value: boolean) => {
      setRemember(value);
      const state = useAnonStore.getState();
      if (value) {
        writeStoredIdentity(
          {
            displayName: state.displayName,
            vibeTags: state.vibeTags,
            gender: state.gender,
          },
          accountId
        );
      } else {
        clearStoredIdentity(accountId);
      }
    },
  };
}