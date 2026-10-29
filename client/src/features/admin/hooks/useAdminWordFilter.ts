import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getWordFilter, saveWordFilter } from '../api/admin';
import type { AdminWordFilterInput } from '../types';
import { adminQueryKeys } from './queryKeys';

export function useWordFilterQuery() {
  return useQuery({
    queryKey: adminQueryKeys.wordFilter,
    queryFn: () => getWordFilter().then((res) => res.data),
    staleTime: 30_000,
  });
}

// The save answers with the fresh settings, written straight to the cache.
export function useSaveWordFilterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminWordFilterInput) => saveWordFilter(input),
    onSuccess: (res) => {
      queryClient.setQueryData(adminQueryKeys.wordFilter, res.data);
    },
  });
}
