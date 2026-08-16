import { useQuery } from '@tanstack/react-query';
import * as authApi from '@/api/auth';
import { queryKeys } from '@/hooks/chat';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

export function useProfileQuery(enabled = true) {
  const setUser = useAuthStore((s) => s.setUser);
  const setImpersonated = useAuthStore((s) => s.setImpersonated);
  const clear = useAuthStore((s) => s.clear);

  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      try {
        const res = await authApi.getProfile();
        setUser(res.user);
        setImpersonated(res.isImpersonated ?? false);
        return res.user;
      } catch (error) {
        clear();
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          return null;
        }
        return null;
      }
    },
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}
