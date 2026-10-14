import { useHubSummary } from '@/features/hub';

/**
 * Whether the server's `rooms` flag is on. `pending` while the flag is unknown;
 * a failed flag fetch fails OPEN — the server refuses rooms itself when off, so
 * hiding them on a hiccup would only make an outage look like a shutdown.
 */
export function useRoomsEnabled(): { pending: boolean; enabled: boolean } {
  const { data, isPending } = useHubSummary();
  return { pending: isPending, enabled: data ? data.features.rooms : true };
}
