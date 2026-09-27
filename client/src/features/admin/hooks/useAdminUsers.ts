import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as adminApi from '@/features/admin/api/admin';
import { adminQueryKeys as queryKeys } from '@/features/admin/hooks/queryKeys';

export function useAdminUsersQuery(
  search = '',
  signupMethod: 'all' | 'google' | 'email' = 'all',
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.users(search, signupMethod),
    queryFn: ({ pageParam }) =>
      adminApi.getAdminUsers({
        q: search || undefined,
        signupMethod,
        limit: adminApi.USERS_PAGE_SIZE,
        before: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled,
    staleTime: 30_000,
  });
}

export function useAdminUserDetailQuery(userId: string | null, enabled = true) {
  return useQuery({
    queryKey: queryKeys.userDetail(userId ?? ''),
    queryFn: () => adminApi.getAdminUser(userId!),
    enabled: enabled && Boolean(userId),
    staleTime: 60_000,
  });
}

export function useDeleteAdminUserMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.deleteAdminUser,
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.usersPrefix });
      void queryClient.removeQueries({ queryKey: queryKeys.userDetail(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

/** window.open must be called synchronously from the click handler (popup-blocker safe).
 *  This mutation has no onSuccess — callers handle the navigation. */
export function useImpersonateMutation() {
  return useMutation({
    mutationFn: adminApi.impersonateUser,
  });
}

export function useAdminImpersonationLogsQuery(enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.impersonationLogs,
    queryFn: ({ pageParam }) =>
      adminApi.getImpersonationLogs({
        limit: adminApi.IMPERSONATION_LOGS_PAGE_SIZE,
        before: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled,
    staleTime: 60_000,
  });
}
