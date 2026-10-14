import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import { queryKeys } from './queryKeys';
import { getQuota } from '../api/match';

/**
 * Remaining whispers today, so the hub card shows a real number instead of
 * the static "30/day" copy. Members only — the query never fires for guests.
 * A failure hides the number; the home screen never breaks on a quota fetch.
 */
export function useWhisperQuota() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.quota,
    queryFn: () => getQuota().then((res) => res.data),
    enabled: Boolean(user),
    staleTime: 60_000,
  });
}
