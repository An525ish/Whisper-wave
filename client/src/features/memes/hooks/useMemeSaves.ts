import { useEffect } from 'react';
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
 * Save toggle with member sync. Local flips instantly; members also persist
 * server-side, reverting locally only if the server refuses.
 */
export function useToggleMemeSave() {
  const toggleSave = useMemeStore((s) => s.toggleSave);

  return (id: number, currentlySaved: boolean) => {
    toggleSave(id);
    if (!currentlySaved) track(MEME_EVENTS.SAVE, {});
    const user = useAuthStore.getState().user;
    if (!user) return;
    const sync = currentlySaved ? unsaveMeme(id) : saveMeme(id);
    sync.catch(() => {
      toggleSave(id); // revert — the server refused
      toast.error('Couldn’t sync your save — kept locally.');
    });
  };
}
