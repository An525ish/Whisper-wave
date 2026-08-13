import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as chatApi from '@/features/chat/api';
import { queryKeys } from '@/features/chat/queryKeys';

export function useSendAttachmentsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.sendAttachments,
    onSuccess: (_data, variables) => {
      const chatId = variables.get('chatId');
      if (typeof chatId === 'string') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.media(chatId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
      }
    },
  });
}

export function useEditMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
      content,
    }: {
      messageId: string;
      content: string;
      chatId: string;
    }) => chatApi.editMessage(messageId, content),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(variables.chatId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useDeleteMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId }: { messageId: string; chatId: string }) =>
      chatApi.deleteMessage(messageId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(variables.chatId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.media(variables.chatId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useDeleteManyMessagesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, messageIds }: { chatId: string; messageIds: string[] }) =>
      chatApi.deleteManyMessages(chatId, messageIds),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(variables.chatId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.media(variables.chatId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useClearChatMessagesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatApi.clearChatMessages(chatId),
    onSuccess: (_data, chatId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.media(chatId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useForwardMessagesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      targetChatId,
      sourceChatId,
      messageIds,
    }: {
      targetChatId: string;
      sourceChatId: string;
      messageIds: string[];
    }) => chatApi.forwardMessages(targetChatId, { sourceChatId, messageIds }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(variables.targetChatId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.media(variables.targetChatId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useFindChatsMutation() {
  return useMutation({ mutationFn: chatApi.findChats });
}
