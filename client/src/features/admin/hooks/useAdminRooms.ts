import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hubKeys } from '@/features/hub';
import {
  banRoomIdentity,
  closeRoomInstance,
  liftRoomBan,
  listAdminRooms,
  listRoomBans,
  setFeatureFlag,
  upsertAdminRoom,
} from '../api/admin';
import { adminQueryKeys } from './queryKeys';
import type { AdminFeatureFlag, AdminRoomBanInput, AdminRoomUpsert } from '../types';

// Mutations carry no toasts: components run them through `useAsyncMutation`,
// which owns the loading/success/error toast so nothing double-fires.

/** Every template with live occupancy — the approval queue reads this. */
export function useAdminRoomsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.rooms,
    queryFn: () => listAdminRooms().then((res) => res.data.rooms),
    staleTime: 10_000,
  });
}

export function useUpsertRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (room: AdminRoomUpsert) => upsertAdminRoom(room),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.rooms });
    },
  });
}

export function useCloseInstanceMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, reason }: { instanceId: string; reason?: string }) =>
      closeRoomInstance(instanceId, reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.rooms });
    },
  });
}

export function useRoomBansQuery() {
  return useQuery({
    queryKey: adminQueryKeys.roomBans,
    queryFn: () => listRoomBans().then((res) => res.data.bans),
    staleTime: 30_000,
  });
}

export function useBanIdentityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ban: AdminRoomBanInput) => banRoomIdentity(ban),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.roomBans });
    },
  });
}

export function useLiftBanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liftRoomBan(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.roomBans });
    },
  });
}

/** The incident switch — one surface off or back on, no deploy. */
export function useFeatureFlagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ feature, enabled }: { feature: AdminFeatureFlag; enabled: boolean }) =>
      setFeatureFlag(feature, enabled),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.rooms });
      void queryClient.invalidateQueries({ queryKey: hubKeys.summary });
    },
  });
}
