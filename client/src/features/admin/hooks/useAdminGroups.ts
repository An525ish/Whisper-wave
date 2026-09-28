import { useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as adminApi from '@/features/admin/api/admin';
import { adminQueryKeys as queryKeys } from '@/features/admin/hooks/queryKeys';

export function useAdminGroupsQuery(search = '', memberId = '', enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.groups(search, memberId),
    queryFn: ({ pageParam }) =>
      adminApi.getAdminGroups({
        q: search || undefined,
        memberId: memberId || undefined,
        limit: adminApi.GROUPS_PAGE_SIZE,
        before: pageParam,
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
    enabled,
    staleTime: 30_000,
  });
}

export function useDeleteAdminGroupMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.deleteAdminGroup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groupsPrefix });
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats });
    },
  });
}

export function useRemoveGroupMemberMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      adminApi.removeAdminGroupMember(groupId, userId),
    onSuccess: (_data, { userId }) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.groupsPrefix });
      // Also refresh the removed member's user detail (stale group membership)
      void queryClient.invalidateQueries({ queryKey: queryKeys.userDetail(userId) });
    },
  });
}
