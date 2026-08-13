import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as chatApi from '@/features/chat/api';
import { queryKeys } from '@/features/chat/queryKeys';

export function useSendFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.sendFriendRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
    },
  });
}

export function useHandleFriendRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.handleFriendRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
      void queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
    },
  });
}
