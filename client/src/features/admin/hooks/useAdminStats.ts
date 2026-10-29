import { useQuery } from '@tanstack/react-query';
import * as adminApi from '../api/admin';
import { adminQueryKeys as queryKeys } from './queryKeys';

export function useAdminStatsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: adminApi.getAdminStats,
    enabled,
    refetchInterval: 30_000,
    staleTime: 29_000, // prevent double-fetch from window-focus + interval
  });
}

export function useWhisperStatsQuery(days: number) {
  return useQuery({
    queryKey: queryKeys.whisper(days),
    queryFn: () => adminApi.getWhisperStats(days).then((res) => res.data),
    refetchInterval: 15_000,
    staleTime: 14_000,
  });
}
