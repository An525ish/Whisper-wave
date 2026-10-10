import { useQuery } from '@tanstack/react-query';
import { listRooms, roomInfo } from '../api/rooms';
import { roomsKeys } from './queryKeys';

/** Lobby list. Fresh on every visit — occupancy goes stale in seconds.
 * Quietly re-polls while mounted so counts stay near-live while browsing. */
export function useRoomsList(enabled = true) {
  return useQuery({
    queryKey: roomsKeys.list,
    queryFn: () => listRooms().then((res) => res.data.rooms),
    enabled,
    staleTime: 10_000,
    refetchInterval: 20_000,
  });
}

/** Room info + rules for the pre-join sheet. Invite unlocks unlisted rooms. */
export function useRoomInfo(slug: string | undefined, invite?: string, enabled = true) {
  return useQuery({
    queryKey: roomsKeys.info(slug, invite),
    queryFn: () => roomInfo(slug ?? '', invite).then((res) => res.data.room),
    enabled: enabled && Boolean(slug),
    staleTime: 30_000,
  });
}
