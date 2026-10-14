import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { listMemes } from '../api/memes';
import { MEME_EXCLUDE_CAP, MEME_LAST_PAGE } from '../constants';
import { memeKeys } from './queryKeys';
import type { MemeCategory, MemeFeedData } from '../types';

/**
 * Shuffle feed pages. An empty page — or page 14, the server's last — ends
 * the list. Ranges are disjoint by construction, so pages compose without
 * dedupe.
 *
 * Past each category's ranged depth the server pours random — each page
 * request carries the ids already in this feed so the tail pours around seen
 * jokes instead of recycling them. Ranged pages ignore the set server-side;
 * the client dedupe in `buildFeedRows` stays as belt-and-braces.
 *
 * `unfiltered` rides the query key: flipping the opt-in swaps streams,
 * never mixes them.
 */
export function useMemesInfinite(category: MemeCategory, unfiltered: boolean, enabled = true) {
  const queryClient = useQueryClient();
  const key = memeKeys.feed(category, unfiltered);
  return useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam }) => {
      const cached = queryClient.getQueryData<{ pages: MemeFeedData[] }>(key);
      const seen = cached?.pages.flatMap((p) => p.items.map((i) => i.id)) ?? [];
      return listMemes(category, pageParam, seen.slice(-MEME_EXCLUDE_CAP)).then((res) => res.data);
    },
    initialPageParam: 0,
    getNextPageParam: (last) =>
      last.items.length === 0 || last.page >= MEME_LAST_PAGE ? undefined : last.page + 1,
    staleTime: 30_000,
    enabled,
  });
}
