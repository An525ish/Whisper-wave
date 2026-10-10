import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useErrors from '@/shared/hooks/useError';
import { createInvite, listInvites, revokeInvite } from '../api/rooms';
import { roomsKeys } from './queryKeys';

/** Live invite links for one room (hosts and mods). */
export function useRoomInvitesQuery(slug: string | undefined, enabled = true) {
  return useQuery({
    queryKey: roomsKeys.invites(slug),
    queryFn: () => listInvites(slug ?? '').then((res) => res.data.invites),
    enabled: enabled && Boolean(slug),
    staleTime: 30_000,
  });
}

/** Mint one invite link. The token is shown once — copy it immediately. */
export function useCreateInviteMutation(slug: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => createInvite(slug),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomsKeys.invites(slug) });
    },
  });

  useErrors([{ isError: mutation.isError, error: mutation.error }]);
  return mutation;
}

export function useRevokeInviteMutation(slug: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeInvite(slug, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: roomsKeys.invites(slug) });
    },
  });
}
