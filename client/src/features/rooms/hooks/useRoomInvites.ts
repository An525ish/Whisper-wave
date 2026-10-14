import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import useErrors from '@/shared/hooks/useError';
import { useCopyToClipboard } from '@/shared/hooks/useCopyToClipboard';
import { expiryLabel } from '@/shared/utils/duration';
import { createInvite, listInvites, revokeInvite } from '../api/rooms';
import { ROOM_INVITES_STALE_MS } from '../constants';
import type { RoomInvite, RoomInviteRow, RoomInviteTerms } from '../types';
import { inviteUrl } from '../utils/inviteLink';
import { roomsKeys } from './queryKeys';

/** Attach the "N left" label. Runs on data change (not in render), so reading the clock is fine. */
const withExpiry = (invites: RoomInvite[]): RoomInviteRow[] =>
  invites.map((invite) => {
    const msLeft = Date.parse(invite.expiresAt) - Date.now();
    return { ...invite, expiry: msLeft <= 0 ? 'expired' : `${expiryLabel(msLeft)} left` };
  });

/** Live invite links for one room (hosts and mods), each with its expiry label. */
export function useRoomInvitesQuery(slug: string | undefined, enabled = true) {
  const query = useQuery({
    queryKey: roomsKeys.invites(slug),
    queryFn: () => listInvites(slug ?? '').then((res) => res.data.invites),
    select: withExpiry,
    enabled: enabled && Boolean(slug),
    staleTime: ROOM_INVITES_STALE_MS,
  });

  useErrors([{ isError: query.isError, error: query.error }]);
  return query;
}

/**
 * Mint one invite link, copy it (the token is shown once) and refresh the
 * list. `data` keeps the fresh link so the sheet can offer copy/share again.
 */
export function useCreateInviteMutation(slug: string) {
  const queryClient = useQueryClient();
  const { copy } = useCopyToClipboard();
  const mutation = useMutation({
    mutationFn: (terms: RoomInviteTerms) => createInvite(slug, terms),
    onSuccess: (res, terms) => {
      copy(inviteUrl(slug, res.data.invite.token));
      toast.success(`Invite link copied — valid ${terms.ttlDays} ${terms.ttlDays === 1 ? 'day' : 'days'}.`);
      void queryClient.invalidateQueries({ queryKey: roomsKeys.invites(slug) });
    },
  });

  useErrors([{ isError: mutation.isError, error: mutation.error }]);
  return mutation;
}

export function useRevokeInviteMutation(slug: string) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (id: string) => revokeInvite(slug, id),
    onSuccess: () => {
      toast.success('Invite link revoked.');
      void queryClient.invalidateQueries({ queryKey: roomsKeys.invites(slug) });
    },
  });

  useErrors([{ isError: mutation.isError, error: mutation.error }]);
  return mutation;
}

/** Hand a link to the OS share sheet (where it exists). Cancelling is not an error. */
export function useShareInvite(title: string) {
  return (url: string) => {
    navigator.share({ title, text: `Join me in ${title} on Wave`, url }).catch((err: unknown) => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      toast.error('Couldn’t open the share sheet — copy the link instead.');
    });
  };
}
