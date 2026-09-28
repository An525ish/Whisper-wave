import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as adminApi from '@/features/admin/api/admin';
import { adminQueryKeys as queryKeys } from '@/features/admin/hooks/queryKeys';

export function useAdminMessagesQuery(
  status: 'all' | 'sent' | 'failed' = 'all',
  search = '',
  senderId = '',
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages(status, search, senderId),
    queryFn: ({ pageParam }) =>
      adminApi.getAdminMessages({
        status,
        q: search || undefined,
        senderId: senderId || undefined,
        limit: adminApi.MESSAGES_PAGE_SIZE,
        before: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled,
    staleTime: 30_000,
  });
}

export function useDeleteAdminMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.deleteAdminMessage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messagesPrefix });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

export function useRetryAdminMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.retryAdminMessage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messagesPrefix });
    },
  });
}
