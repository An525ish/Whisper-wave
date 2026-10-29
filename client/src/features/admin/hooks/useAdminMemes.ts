import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { blockMeme, listMemeBlocklist, unblockMeme } from '../api/admin';
import { adminQueryKeys } from './queryKeys';

export function useMemeBlocklistQuery() {
  return useQuery({
    queryKey: adminQueryKeys.memeBlocklist,
    queryFn: () => listMemeBlocklist().then((res) => res.data),
    staleTime: 30_000,
  });
}

// Both mutations answer with the fresh blocklist — written straight to the cache.
export function useBlockMemeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => blockMeme(id),
    onSuccess: (res) => {
      queryClient.setQueryData(adminQueryKeys.memeBlocklist, res.data);
    },
  });
}

export function useUnblockMemeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => unblockMeme(id),
    onSuccess: (res) => {
      queryClient.setQueryData(adminQueryKeys.memeBlocklist, res.data);
    },
  });
}
