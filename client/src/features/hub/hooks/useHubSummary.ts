import { useQuery } from '@tanstack/react-query';
import { getHubSummary } from '../api/hub';
import { hubKeys } from './queryKeys';

/**
 * Server-driven feature flags for the hub home.
 *
 * The endpoint is public and flag-only, so a failure must never break the
 * home screen — the caller renders the static skeleton instead.
 */
export function useHubSummary() {
  return useQuery({
    queryKey: hubKeys.summary,
    queryFn: getHubSummary,
    // Fresh enough that a flag flip reaches the home screen within seconds,
    // cheap enough that a busy home page never becomes backend load.
    staleTime: 10_000,
  });
}
