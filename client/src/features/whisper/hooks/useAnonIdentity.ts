import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/features/auth';
import { IDENTITY_SAVE_DEBOUNCE_MS, SAVED_HINT_MS } from '../constants';
import { useAnonStore } from '../stores/anonStore';
import {
  clearStoredIdentity,
  readStoredIdentity,
  writeStoredIdentity,
} from '../utils/anonIdentityStorage';
import type { Gender, StoredIdentity, VibeTag } from '../types';

/**
 * Read/write the anonymous identity from the panel.
 *
 * - **Edits reach the server with the NEXT match.** They mark the identity dirty
 *   in the store; `useAnonSocket.sendNext` rewrites the card (`POST /match/join`)
 *   before it re-queues, because the server re-queues from the stored card.
 * - **It does not change who you are mid-thread.** A partner already received the
 *   alias you matched with; swapping it would make the header, the "you" avatar
 *   and their view disagree. The thread keeps `sessionAlias`.
 * - It does **not** derive the alias from the signed-in account: the alias is what
 *   the other party sees, so defaulting it to a real name would de-anonymise them.
 *   The account only scopes where the alias is remembered.
 */
export function useAnonIdentity() {
  const displayName = useAnonStore((s) => s.displayName);
  const vibeTags = useAnonStore((s) => s.vibeTags);
  const gender = useAnonStore((s) => s.gender);
  const accountId = useAuthStore((s) => s.user?._id);

  const [remember, setRemember] = useState<boolean>(() => readStoredIdentity(accountId) !== null);
  const [rememberFor, setRememberFor] = useState(accountId);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  // The saved-state follows the account: switching accounts re-reads it.
  if (rememberFor !== accountId) {
    setRememberFor(accountId);
    setRemember(readStoredIdentity(accountId) !== null);
  }

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

  /** Write the CURRENT store identity to localStorage. */
  const persistNow = useCallback(() => {
    const s = useAnonStore.getState();
    writeStoredIdentity(
      { displayName: s.displayName, vibeTags: s.vibeTags, gender: s.gender },
      accountId
    );
  }, [accountId]);

  const cancelPersist = useCallback(() => {
    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  // Typing an alias fires per keystroke; coalesce the localStorage writes, and
  // flush a pending one on unmount so the last edit is never lost.
  useEffect(
    () => () => {
      if (saveTimerRef.current === null) return;
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
      persistNow();
    },
    [persistNow]
  );

  const apply = useCallback(
    (next: Partial<StoredIdentity>) => {
      const state = useAnonStore.getState();
      state.editIdentity(
        next.displayName ?? state.displayName,
        next.vibeTags ?? state.vibeTags,
        next.gender ?? state.gender
      );
      if (remember) {
        cancelPersist();
        saveTimerRef.current = window.setTimeout(() => {
          saveTimerRef.current = null;
          persistNow();
        }, IDENTITY_SAVE_DEBOUNCE_MS);
        setSavedAt(Date.now());
      }
    },
    [remember, cancelPersist, persistNow]
  );

  const changeRemember = useCallback(
    (value: boolean) => {
      setRemember(value);
      cancelPersist();
      if (value) persistNow();
      else clearStoredIdentity(accountId);
    },
    [accountId, cancelPersist, persistNow]
  );

  return {
    displayName,
    vibeTags,
    /** `prefer_not_to_say` is the wire value; the picker shows it as "unset". */
    gender: (gender === 'prefer_not_to_say' ? null : gender) as Gender | null,
    remember,
    justSaved: savedAt !== null,
    setAlias: (value: string) => apply({ displayName: value }),
    setTags: (value: VibeTag[]) => apply({ vibeTags: value }),
    setGender: (value: Gender | null) => apply({ gender: value ?? 'prefer_not_to_say' }),
    setRemember: changeRemember,
  };
}
