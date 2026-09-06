import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as authApi from '@/api/auth';
import { queryKeys } from '@/hooks/chat';
import { useAuthStore } from '@/stores/auth';

export function useProfileQuery(enabled = true) {
  const setUser = useAuthStore((s) => s.setUser);
  const setImpersonated = useAuthStore((s) => s.setImpersonated);
  const clear = useAuthStore((s) => s.clear);

  // queryFn is pure — no store writes inside to avoid double-fire under React Strict Mode.
  // TQ v5 removed onSuccess/onError; sync store via useEffect instead.
  const query = useQuery({
    queryKey: queryKeys.profile,
    queryFn: authApi.getProfile,
    enabled,
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data.user);
      setImpersonated(query.data.isImpersonated ?? false);
    }
  }, [query.data, setUser, setImpersonated]);

  useEffect(() => {
    if (query.isError) clear();
  }, [query.isError, clear]);

  return query;
}
