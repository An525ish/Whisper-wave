import { useQuery } from '@tanstack/react-query';
import * as adminApi from '@/features/admin/api/admin';
import { adminQueryKeys as queryKeys } from '@/features/admin/hooks/queryKeys';

export function useAdminStatsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: adminApi.getAdminStats,
    enabled,
    refetchInterval: 30_000,
    staleTime: 29_000, // prevent double-fetch from window-focus + interval
  });
}
