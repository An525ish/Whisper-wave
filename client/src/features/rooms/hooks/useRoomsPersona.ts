import { useCallback, useState } from 'react';
import { readWhisperIdentity, renameWhisperIdentity } from '@/features/whisper';
import { useAuthStore } from '@/features/auth';
import { mergePersona, readRoomsPersona, saveRoomsPersona } from '../utils/persona';
import type { RoomsPersona } from '../types';

/**
 * The one persona (HUB_PLAN §6.4) as the rooms join form sees it: the Whisper
 * alias prefills it, the rooms color rides along, and saving writes both so an
 * edit here is an edit there. Read once on mount (lazy init), not per render.
 */
export function useRoomsPersona() {
  const accountId = useAuthStore((s) => s.user?._id);
  const [persona] = useState<RoomsPersona | null>(() =>
    mergePersona(readRoomsPersona(), readWhisperIdentity(accountId)?.displayName ?? null)
  );

  const savePersona = useCallback(
    (next: RoomsPersona) => {
      saveRoomsPersona(next);
      renameWhisperIdentity(next.alias, accountId);
    },
    [accountId]
  );

  return { persona, savePersona };
}
