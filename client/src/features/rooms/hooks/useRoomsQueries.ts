import { useQuery } from '@tanstack/react-query';
import { listReminders, listRooms, myRooms, roomInfo } from '../api/rooms';
import { ROOM_INFO_STALE_MS, ROOM_LIST_POLL_MS, ROOM_LIST_STALE_MS } from '../constants';
import { roomsKeys } from './queryKeys';

/** Lobby list. Fresh on every visit — occupancy goes stale in seconds.
 * Quietly re-polls while mounted so counts stay near-live while browsing. */
export function useRoomsList(enabled = true) {
  return useQuery({
    queryKey: roomsKeys.list,
    queryFn: () => listRooms().then((res) => res.data.rooms),
    enabled,
    staleTime: ROOM_LIST_STALE_MS,
    refetchInterval: ROOM_LIST_POLL_MS,
  });
}

/** Room info + rules for the pre-join sheet. Invite unlocks unlisted rooms. */
export function useRoomInfo(slug: string | undefined, invite?: string, enabled = true) {
  return useQuery({
    queryKey: roomsKeys.info(slug, invite),
    queryFn: () => roomInfo(slug ?? '', invite).then((res) => res.data.room),
    enabled: enabled && Boolean(slug),
    staleTime: ROOM_INFO_STALE_MS,
  });
}

/** Rooms the member is waiting on. Members only — guests never fetch it. */
export function useRoomRemindersQuery(enabled: boolean) {
  return useQuery({
    queryKey: roomsKeys.reminders,
    queryFn: () => listReminders().then((res) => res.data.slugs),
    enabled,
    staleTime: ROOM_LIST_STALE_MS,
  });
}

/** Rooms I host + private-room eligibility. Members only — guests never fetch it. */
export function useMyRoomsQuery(enabled: boolean) {
  return useQuery({
    queryKey: roomsKeys.mine,
    queryFn: () => myRooms().then((res) => res.data),
    enabled,
    staleTime: ROOM_LIST_STALE_MS,
  });
}
