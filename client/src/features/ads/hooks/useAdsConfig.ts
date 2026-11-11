import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/features/auth';
import { useHasPass } from '@/features/pass';
import * as adsApi from '../api/ads';

/**
 * Which ad slots to show. The server decides (no config, or a Spark Pass, means
 * none). Keyed on sign-in and pass so buying a pass drops the ads straight away
 * instead of waiting for the cache to expire.
 */
export const useAdsConfig = () => {
  const signedIn = useAuthStore((s) => s.user !== null);
  const hasPass = useHasPass();
  return useQuery({
    queryKey: ['ads', 'config', signedIn, hasPass] as const,
    queryFn: adsApi.getAdsConfig,
    staleTime: 5 * 60_000,
  });
};
