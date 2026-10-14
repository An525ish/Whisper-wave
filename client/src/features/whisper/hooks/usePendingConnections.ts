import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth';
import { queryKeys } from './queryKeys';
import { cancelPending, completeConnection, listPending } from '../api/connection';
import { useOpenWhisperDm } from './useOpenWhisperDm';

/**
 * Pending whisper connections: mutual-like claims on this browser plus rows
 * where I am bound and the partner is not. Members only — guests have no
 * account to bind, so the query never fires for them.
 */
export function usePendingConnectionsQuery() {
  const user = useAuthStore((s) => s.user);
  return useQuery({
    queryKey: queryKeys.pending,
    queryFn: () => listPending().then((res) => res.data.items),
    enabled: Boolean(user),
    staleTime: 30_000,
  });
}

/**
 * Redeem a `claim:<sessionId>` item after signing in. Connected → the DM
 * opens; still waiting → the ghost row flips to "waiting for them".
 */
export function useRedeemClaimMutation() {
  const queryClient = useQueryClient();
  const openDm = useOpenWhisperDm();
  return useMutation({
    mutationFn: (claimId: string) => completeConnection({ claimId }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.pending });
      if (res.data.status === 'connected') {
        openDm(res.data.chatId, 'pending');
        return;
      }
      toast.success('Waiting for them to connect');
    },
  });
}

/** Cancel one pending item. Claims vanish; rows release only my seat. */
export function useCancelPendingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelPending(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.pending });
    },
  });
}
