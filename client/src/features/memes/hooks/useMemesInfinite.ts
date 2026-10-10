import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { listMemes } from '../api/memes';
import { memeKeys } from './queryKeys';
import type { MemeCategory, MemeFeedData } from '../types';

/**
 * Shuffle feed pages. `nonce` re-shuffles (new key, fresh pages); an empty
 * page ends the list. Ranges are disjoint by construction, so pages compose
 * without dedupe.
 *
 * Past each category's ranged depth the server pours random — each page
 * request carries the ids already in this feed (cap 500) so the tail pours
 * around seen jokes instead of recycling them. Ranged pages ignore the set
 * server-side; the client dedupe in the feed stays as belt-and-braces.
 *
 * `unfiltered` rides the query key: flipping the opt-in swaps streams,
 * never mixes them.
 */
export function useMemesInfinite(category: MemeCategory, nonce: number, unfiltered: boolean) {
  const queryClient = useQueryClient();
  const key = memeKeys.feed(category, nonce, unfiltered);
  return useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => {
      const cached = queryClient.getQueryData<{ pages: MemeFeedData[] }>(key);
      const seen = cached?.pages.flatMap((p) => p.items.map((i) => i.id)) ?? [];
      return listMemes(category, pageParam, seen.slice(-500)).then((res) => res.data);
    },
    initialPageParam: 0,
    getNextPageParam: (last) => (last.items.length === 0 ? undefined : last.page + 1),
    staleTime: 30_000,
  });
}
