import { useQuery } from '@tanstack/react-query';
import * as authApi from '@/features/auth/api';
import { queryKeys } from '@/features/chat/queryKeys';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/features/auth/store';

export function useProfileQuery(enabled = true) {
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      try {
        const res = await authApi.getProfile();
        setUser(res.user);
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
