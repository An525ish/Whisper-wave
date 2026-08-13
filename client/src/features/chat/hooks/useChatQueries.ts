import { keepPreviousData, useQuery } from '@tanstack/react-query';
import * as chatApi from '@/features/chat/api';
import { queryKeys } from '@/features/chat/queryKeys';
import { isValidChatId } from '@/shared/utils/helper';

export function useMyChatsQuery() {
  return useQuery({
    queryKey: queryKeys.chats,
    queryFn: chatApi.getMyChats,
  });
}

export function useChatDetailsQuery(
  params: { id?: string; populate?: boolean },
  options?: { skip?: boolean },
) {
  const id = params.id ?? '';
  return useQuery({
    queryKey: queryKeys.chatDetails(id, params.populate),
    queryFn: () => chatApi.getChatDetails({ id, populate: params.populate }),
    enabled: isValidChatId(id) && !options?.skip,
  });
}

export function useMyFriendsQuery(params?: { chatId?: string }) {
  return useQuery({
    queryKey: queryKeys.friends(params?.chatId),
    queryFn: () => chatApi.getMyFriends(params),
  });
}

export function useSearchUsersQuery(name: string) {
  const trimmed = name.trim();

  return useQuery({
    queryKey: queryKeys.searchUsers(trimmed),
    queryFn: () => chatApi.searchUser(trimmed),
    enabled: trimmed.length > 0,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useGetMyNotificationsQuery() {
  return useQuery({
    queryKey: queryKeys.notifications,
    queryFn: chatApi.getMyNotifications,
    staleTime: 0,
  });
}
