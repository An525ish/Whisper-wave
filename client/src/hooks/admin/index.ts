import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '@/api/admin';
import { adminQueryKeys as queryKeys } from '@/hooks/admin/queryKeys';
import { useAdminStore } from '@/stores/admin';

export function useAdminMeQuery() {
  const setAdmin = useAdminStore((s) => s.setAdmin);
  const clear = useAdminStore((s) => s.clear);

  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => {
      try {
        const res = await adminApi.adminMe();
        if (res.isAdmin) setAdmin(true);
        else clear();
        return res;
      } catch {
        clear();
        return { success: false, isAdmin: false };
      }
    },
    retry: false,
    staleTime: 60_000,
  });
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
  });
}

export function useAdminUsersQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: adminApi.getAdminUsers,
    enabled,
  });
}

export function useAdminMessagesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.messages,
    queryFn: adminApi.getAdminMessages,
    enabled,
  });
}

export function useAdminGroupsQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.groups,
    queryFn: adminApi.getAdminGroups,
    enabled,
  });
}
