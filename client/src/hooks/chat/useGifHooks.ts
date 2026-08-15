import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as gifApi from '@/api/gif';
import type { KlipyKind } from '@/api/gif';
import * as chatApi from '@/api/chat';
import { queryKeys } from './queryKeys';

export function useGifSearch(query: string, kind: KlipyKind = 'gif') {
  const isSearch = query.trim().length > 0;

  return useQuery({
    queryKey: ['klipy', kind, isSearch ? 'search' : 'trending', query],
    queryFn: () =>
      isSearch
        ? gifApi.searchMedia(query, kind)
        : gifApi.trendingMedia(kind),
    select: (res) => res.data,
    staleTime: isSearch ? 1000 * 60 * 5 : 1000 * 60 * 10,
    placeholderData: (prev) => prev,
  });
}

export function useSendGifMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.sendGif,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages(variables.chatId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}
