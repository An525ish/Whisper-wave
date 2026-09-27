import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import * as adminApi from '@/features/admin/api/admin';
import type { ServerActivityFilter } from '@/features/admin/api/admin';
import { adminQueryKeys as queryKeys } from '@/features/admin/hooks/queryKeys';

export function useAdminActivityPresenceQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.activityPresence,
    queryFn: adminApi.getAdminActivityPresence,
    enabled,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
}

export function useAdminActivityEventsQuery(
  type: ServerActivityFilter = 'all',
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.activityEvents(type),
    queryFn: ({ pageParam }) =>
      adminApi.getAdminActivityEvents({
        type,
        limit: adminApi.ACTIVITY_PAGE_SIZE,
        before: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled,
    staleTime: 30_000,
    // refetchOnWindowFocus is TQ's default (true) — no need to re-declare
  });
}
