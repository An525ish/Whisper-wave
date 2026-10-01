import { useQuery } from '@tanstack/react-query';
import { getConnectionOrigin } from '../api/connection';
import { queryKeys } from './queryKeys';
import type { ConnectionOrigin } from '../types';

/**
 * The "how we met" banner for a DM that started as an anonymous match.
 *
 * Returns null for ordinary DMs — those simply have no Connection record, and
 * the component renders nothing. Disabled entirely when signed out, since the
 * endpoint is authed.
 */
export function useConnectionOrigin(
  chatId: string | undefined,
  enabled: boolean
) {
  return useQuery<ConnectionOrigin | null>({
    queryKey: queryKeys.connectionOrigin(chatId),
    queryFn: async () => (await getConnectionOrigin(chatId!)).data.origin,
    enabled: Boolean(chatId) && enabled,
    staleTime: Infinity,
    retry: false,
  });
}
