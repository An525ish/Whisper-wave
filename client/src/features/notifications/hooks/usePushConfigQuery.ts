import { useQuery } from '@tanstack/react-query';
import { getPushConfig } from '../api/push';
import type { EnabledPushConfig } from '../types';
import { pushKeys } from './queryKeys';

/**
 * Public, rarely-changing server config — fetched once per page load.
 * `data` is the enabled config, or `undefined` while loading / when push is off.
 */
export function usePushConfigQuery(enabled = true) {
  return useQuery({
    queryKey: pushKeys.config,
    queryFn: getPushConfig,
    enabled,
    staleTime: Infinity,
    retry: false,
    select: (config): EnabledPushConfig | null => (config.enabled === true ? config : null),
  });
}
