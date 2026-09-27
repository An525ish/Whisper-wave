import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as adminApi from '@/features/admin/api/admin';
import { adminQueryKeys as queryKeys } from '@/features/admin/hooks/queryKeys';
import { useAdminStore } from '@/features/admin/store';

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
