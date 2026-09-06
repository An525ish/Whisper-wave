import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import * as adminApi from '@/api/admin';
import type { ServerActivityFilter } from '@/api/admin';
import { adminQueryKeys as queryKeys } from '@/hooks/admin/queryKeys';
import { useAdminStore } from '@/stores/admin';
import type { AttachmentKindFilter } from '@/types/admin';

export function useAdminMeQuery() {
  const setAdmin = useAdminStore((s) => s.setAdmin);
  const clear = useAdminStore((s) => s.clear);

  const query = useQuery({
    queryKey: queryKeys.me,
    queryFn: adminApi.adminMe, // pure — no side effects in queryFn
    retry: false,
    staleTime: 60_000,
  });

  // Sync result to Zustand store (TQ v5: no onSuccess/onError on useQuery)
  useEffect(() => {
    if (!query.data) return;
    if (query.data.isAdmin) setAdmin(true);
    else clear();
  }, [query.data, setAdmin, clear]);

  useEffect(() => {
    if (query.isError) clear();
  }, [query.isError, clear]);

  return query;
}

export function useAdminLoginMutation() {
  const setAdmin = useAdminStore((s) => s.setAdmin);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.adminLogin,
    onSuccess: (res) => {
      setAdmin(Boolean(res.isAdmin));
      queryClient.setQueryData(queryKeys.me, res);
    },
  });
}

export function useAdminLogoutMutation() {
  const clear = useAdminStore((s) => s.clear);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.adminLogout,
    onSettled: () => {
      clear();
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

export function useAdminStatsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.stats,
    queryFn: adminApi.getAdminStats,
    enabled,
    refetchInterval: 30_000,
    staleTime: 29_000, // prevent double-fetch from window-focus + interval
  });
}

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

export function useRetryAdminMessageMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminApi.retryAdminMessage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messagesPrefix });
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

export { useActivityPage } from '@/hooks/admin/useActivityPage';
export { useAttachmentsPage } from '@/hooks/admin/useAttachmentsPage';
export { useDashboardPage } from '@/hooks/admin/useDashboardPage';
export { useGroupsPage } from '@/hooks/admin/useGroupsPage';
export { useUsersPage } from '@/hooks/admin/useUsersPage';
export { useMessagesPage } from '@/hooks/admin/useMessagesPage';
