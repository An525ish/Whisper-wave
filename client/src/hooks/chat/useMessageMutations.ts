import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as chatApi from '@/api/chat';
import { queryKeys } from '@/hooks/chat';

export function useSendAttachmentsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.commitAttachments,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.media(variables.chatId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(variables.chatId) });
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

export function useDeleteChatForMeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatApi.deleteChatForMe(chatId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useClearChatForMeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatApi.clearChatForMe(chatId),
    onSuccess: (_data, chatId) => {
      // Patch chats cache so the list preview shows a placeholder instead of the
      // real last message (which the user can no longer see). Other members are unaffected.
      queryClient.setQueryData<import('@/types/chat').ChatsResponse>(queryKeys.chats, (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((chat) =>
            chat._id !== chatId
              ? chat
              : { ...chat, lastMessage: { content: 'You cleared this chat', createdAt: chat.lastMessage?.createdAt, isRead: true } },
          ),
        };
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.messages(chatId) });
    },
  });
}

export function useUnfriendMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatApi.unfriend(chatId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatApi.deleteGroup(chatId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}
