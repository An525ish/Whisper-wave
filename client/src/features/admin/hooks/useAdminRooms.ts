import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  banRoomIdentity,
  closeRoomInstance,
  liftRoomBan,
  listAdminRooms,
  listRoomBans,
  setFeatureFlag,
  upsertAdminRoom,
} from '@/features/admin/api/admin';
import { adminQueryKeys } from '@/features/admin/hooks/queryKeys';
import type { AdminRoomBanInput, AdminRoomUpsert } from '@/features/admin/types';

/** Every template with live occupancy — the approval queue reads this. */
export function useAdminRoomsQuery() {
  return useQuery({
    queryKey: adminQueryKeys.rooms,
    queryFn: () => listAdminRooms().then((res) => res.rooms),
    staleTime: 10_000,
  });
}

export function useUpsertRoomMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (room: AdminRoomUpsert) => upsertAdminRoom(room),
    onSuccess: () => {
      toast.success('Room saved.');
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
      toast.success('Instance closed.');
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.rooms });
    },
  });
}

export function useRoomBansQuery() {
  return useQuery({
    queryKey: adminQueryKeys.roomBans,
    queryFn: () => listRoomBans().then((res) => res.bans),
    staleTime: 30_000,
  });
}

export function useBanIdentityMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ban: AdminRoomBanInput) => banRoomIdentity(ban),
    onSuccess: () => {
      toast.success('Banned.');
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.roomBans });
    },
  });
}

export function useLiftBanMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => liftRoomBan(id),
    onSuccess: () => {
      toast.success('Ban lifted.');
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.roomBans });
    },
  });
}

/** The incident switch — one surface off or back on, no deploy. */
export function useFeatureFlagMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ feature, enabled }: { feature: 'rooms' | 'games' | 'memes'; enabled: boolean }) =>
      setFeatureFlag(feature, enabled),
    onSuccess: (_res, { feature, enabled }) => {
      toast.success(`${feature} ${enabled ? 'enabled' : 'disabled'}.`);
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.rooms });
      void queryClient.invalidateQueries({ queryKey: ['hub'] });
    },
  });
}
