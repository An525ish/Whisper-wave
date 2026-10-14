import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth';
import { track } from '@/shared/lib/analytics';
import { MEME_EVENTS } from '../constants';
import { listSaves, saveMeme, unsaveMeme } from '../api/memes';
import { memeKeys } from './queryKeys';
import { useMemeStore } from '../stores/memeStore';

/**
 * Member save sync. Server ids union into local state on load (additive —
 * no conflict, no opt-in dance); guests never fire the query.
 */
export function useMemeSavesQuery() {
  const user = useAuthStore((s) => s.user);
  const mergeSaves = useMemeStore((s) => s.mergeSaves);
  const query = useQuery({
    queryKey: memeKeys.saves,
    queryFn: () => listSaves().then((res) => res.data.ids),
    enabled: Boolean(user),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) mergeSaves(query.data);
  }, [query.data, mergeSaves]);

  return query;
}

/**
 * Save toggle. Local flips instantly. Members also persist server-side and
 * revert only if the server refuses; guests keep it on the device and get a
 * gentle nudge that an account would keep it everywhere.
 */
export function useToggleMemeSave() {
  const toggleSave = useMemeStore((s) => s.toggleSave);

  return useCallback(
    (id: number) => {
      const wasSaved = useMemeStore.getState().saves.includes(id);
      toggleSave(id);
      if (!wasSaved) track(MEME_EVENTS.SAVE, {});

      if (!useAuthStore.getState().user) {
        if (!wasSaved) toast('Saved on this device — sign in to keep it everywhere.');
        return;
      }
      const sync = wasSaved ? unsaveMeme(id) : saveMeme(id);
      sync.catch(() => {
        toggleSave(id);
        toast.error('Couldn’t sync your save — try again.');
      });
    },
    [toggleSave]
  );
}
