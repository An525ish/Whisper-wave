import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import { track } from '@/shared/lib/analytics';
import { MEME_EVENTS } from '../constants';
import { getMemeMode, setMemeMode } from '../api/memes';
import { memeKeys } from './queryKeys';

/**
 * This member's unfiltered opt-in. Guests never fire the query — absent
 * means filtered, always. The feed keys off this value, so flipping it
 * swaps streams instead of mixing them.
 */
export function useMemeMode() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: memeKeys.mode,
    queryFn: () => getMemeMode().then((res) => res.data.unfiltered),
    enabled: Boolean(user),
    staleTime: 60_000,
  });
}

/** Flip the opt-in with an optimistic flag. Rolls back if the server refuses. */
export function useSetMemeMode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ unfiltered, confirmAdult }: { unfiltered: boolean; confirmAdult?: boolean }) =>
      setMemeMode(unfiltered, confirmAdult).then((res) => res.data.unfiltered),
    onSuccess: (unfiltered) => {
      queryClient.setQueryData(memeKeys.mode, unfiltered);
      track(MEME_EVENTS.MODE_CHANGE, { unfiltered });
    },
  });
}
