import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '@/features/auth';
import { queryKeys } from '@/features/chat/hooks';
import { useAuthStore } from '@/features/auth';
import { ApiError } from '@/shared/lib/api/client';

export function useProfileQuery(enabled = true) {
  const setUser = useAuthStore((s) => s.setUser);
  const setImpersonated = useAuthStore((s) => s.setImpersonated);
  const clear = useAuthStore((s) => s.clear);
  const setBootstrapped = useAuthStore((s) => s.setBootstrapped);

  // queryFn is pure — no store writes inside to avoid double-fire under React Strict Mode.
  // TQ v5 removed onSuccess/onError; sync store via useEffect instead.
  const query = useQuery({
    queryKey: queryKeys.profile,
    queryFn: authApi.getProfile,
    enabled,
    staleTime: 60_000,
    // Retry transient failures (network blip, 5xx, server restart) but never an
    // auth failure: the api client has already tried a refresh by the time a 401
    // surfaces, so retrying only delays the logged-out transition.
    retry: (failureCount, error) =>
      !(error instanceof ApiError && (error.status === 401 || error.status === 403)) &&
      failureCount < 2,
    retryDelay: 500,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data.user);
      setImpersonated(query.data.isImpersonated ?? false);
    }
  }, [query.data, setUser, setImpersonated]);

  useEffect(() => {
    // Only clear session on a definitive 401 (token truly expired/revoked).
    // Network errors or other status codes should not log the user out.
    if (query.isError && query.error instanceof ApiError && query.error.status === 401) {
      clear();
    }
  }, [query.isError, query.error, clear]);

  /**
   * Release the boot gate once the request has *settled*, whatever the outcome.
   *
   * This must not be conditional on success: `App.tsx` renders a full-screen
   * loader while `bootstrapped` is false, so a backend that is down, a DNS
   * failure or a CORS rejection used to leave the app stuck on "Getting things
   * ready…" forever — no error, no retry, no way forward.
   */
  useEffect(() => {
    if (query.isError) setBootstrapped(true);
  }, [query.isError, setBootstrapped]);

  return query;
}
