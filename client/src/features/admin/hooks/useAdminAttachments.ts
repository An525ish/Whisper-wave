import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as adminApi from '@/features/admin/api/admin';
import { adminQueryKeys as queryKeys } from '@/features/admin/hooks/queryKeys';
import type { AttachmentKindFilter } from '@/features/admin/types';

export function useAdminAttachmentsQuery(
  search = '',
  senderId = '',
  kind: AttachmentKindFilter = 'all',
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.attachments(search, senderId, kind),
    queryFn: ({ pageParam }) =>
      adminApi.getAdminAttachments({
        q: search || undefined,
        senderId: senderId || undefined,
        kind,
        limit: adminApi.ATTACHMENTS_PAGE_SIZE,
        before: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled,
    staleTime: 30_000,
  });
}

export function useDeleteAdminAttachmentsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.deleteAdminAttachments,
    onSuccess: () => {
      // Attachments are message records — invalidate both views + stats
      void queryClient.invalidateQueries({ queryKey: queryKeys.attachmentsPrefix });
      void queryClient.invalidateQueries({ queryKey: queryKeys.messagesPrefix });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}
