import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import * as authApi from '@/features/auth/api';
import * as chatApi from '@/features/chat/api';
import { queryKeys } from '@/features/chat/queryKeys';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/features/auth/store';
import { isValidChatId } from '@/shared/utils/helper';

export function useProfileQuery(enabled = true) {
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      try {
        const res = await authApi.getProfile();
        setUser(res.user);
        return res.user;
      } catch (error) {
        clear();
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          return null;
        }
        // Network / server errors: still mark bootstrapped so the app can render
        return null;
      }
    },
    enabled,
    staleTime: 60_000,
    retry: false,
  });
}

export function useSignInMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.signIn,
    onSuccess: (res) => {
      setUser(res.data);
      queryClient.setQueryData(queryKeys.profile, res.data);
    },
  });
}

export function useSignUpMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.signUp,
    onSuccess: (res) => {
      setUser(res.data);
      queryClient.setQueryData(queryKeys.profile, res.data);
    },
  });
}

export function useSignOutMutation() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.signOut,
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}

export function useUpdateProfileMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (res) => {
      if (res.user) {
        setUser(res.user);
        queryClient.setQueryData(queryKeys.profile, res.user);
      }
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

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
    queryFn: () =>
      chatApi.getChatDetails({ id, populate: params.populate }),
    enabled: isValidChatId(id) && !options?.skip,
  });
}

export function useMyFriendsQuery(params?: { chatId?: string }) {
  return useQuery({
    queryKey: queryKeys.friends(params?.chatId),
    queryFn: () => chatApi.getMyFriends(params),
  });
}

export function useInfiniteMessagesQuery(chatId?: string) {
  const id = chatId ?? '';

  return useInfiniteQuery({
    queryKey: queryKeys.messages(id),
    queryFn: ({ pageParam }) => chatApi.getMessages(id, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const totalPages =
        (lastPage as { totalPages?: number } | undefined)?.totalPages ?? 0;
      return lastPageParam < totalPages ? lastPageParam + 1 : undefined;
    },
    enabled: isValidChatId(id),
  });
}

export function useSearchMessagesQuery(
  params: {
    chatId?: string;
    q?: string;
    scope?: 'all' | 'text' | 'media' | 'links';
    from?: 'anyone' | 'me' | 'others';
    dateFrom?: string;
    dateTo?: string;
    senderId?: string;
  },
  options?: { enabled?: boolean },
) {
  const chatId = params.chatId ?? '';
  const q = (params.q ?? '').trim();
  const scope = params.scope ?? 'all';
  const from = params.from ?? 'anyone';
  const dateFrom = params.dateFrom ?? '';
  const dateTo = params.dateTo ?? '';
  const senderId = params.senderId ?? '';
  const hasDate = Boolean(dateFrom);
  const hasBrowseScope = scope === 'media' || scope === 'links';
  const canSearch = q.length >= 1 || hasDate || hasBrowseScope;

  return useQuery({
    queryKey: queryKeys.messageSearch(
      chatId,
      q,
      scope,
      from,
      dateFrom,
      dateTo,
      senderId,
    ),
    queryFn: () =>
      chatApi.searchMessages({
        chatId,
        q,
        scope,
        from,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        senderId: senderId || undefined,
      }),
    enabled:
      isValidChatId(chatId) && canSearch && (options?.enabled ?? true),
    staleTime: 20_000,
    placeholderData: keepPreviousData,
    retry: false,
  });
}

export function useJumpToDateMutation() {
  return useMutation({
    mutationFn: (params: {
      chatId: string;
      dateFrom: string;
      dateTo?: string;
    }) => chatApi.jumpToDate(params),
  });
}

export function useActiveMessageDatesQuery(
  params: {
    chatId?: string;
    dateFrom?: string;
    dateTo?: string;
    tz?: string;
  },
  options?: { enabled?: boolean },
) {
  const chatId = params.chatId ?? '';
  const dateFrom = params.dateFrom ?? '';
  const dateTo = params.dateTo ?? '';
  const tz =
    params.tz ||
    (typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : 'UTC');

  return useQuery({
    queryKey: queryKeys.activeMessageDates(chatId, dateFrom, dateTo, tz),
    queryFn: async () => {
      const res = (await chatApi.listActiveDates({
        chatId,
        dateFrom,
        dateTo,
        tz,
      })) as { dates?: string[]; minYear?: number | null };
      return {
        dates: res.dates ?? [],
        minYear: res.minYear ?? null,
      };
    },
    enabled:
      isValidChatId(chatId) &&
      Boolean(dateFrom && dateTo) &&
      (options?.enabled ?? true),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    retry: false,
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

export function useGetMediaQuery(
  params: { chatId?: string },
  options?: { skip?: boolean },
) {
  const chatId = params.chatId ?? '';
  return useQuery({
    queryKey: queryKeys.media(chatId),
    queryFn: () => chatApi.getMedia(chatId),
    enabled: isValidChatId(chatId) && !options?.skip,
  });
}

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
      void queryClient.invalidateQueries({
        queryKey: queryKeys.notifications,
      });
      void queryClient.invalidateQueries({ queryKey: ['searchUsers'] });
    },
  });
}

export function useSendAttachmentsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.sendAttachments,
    onSuccess: (_data, variables) => {
      const chatId = variables.get('chatId');
      if (typeof chatId === 'string') {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.media(chatId),
        });
        void queryClient.invalidateQueries({
          queryKey: queryKeys.messages(chatId),
        });
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
      chatId,
    }: {
      messageId: string;
      content: string;
      chatId: string;
    }) => chatApi.editMessage(messageId, content),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages(variables.chatId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useDeleteMessageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      messageId,
    }: {
      messageId: string;
      chatId: string;
    }) => chatApi.deleteMessage(messageId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages(variables.chatId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.media(variables.chatId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useDeleteManyMessagesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      chatId,
      messageIds,
    }: {
      chatId: string;
      messageIds: string[];
    }) => chatApi.deleteManyMessages(chatId, messageIds),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages(variables.chatId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.media(variables.chatId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useClearChatMessagesMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatId: string) => chatApi.clearChatMessages(chatId),
    onSuccess: (_data, chatId) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages(chatId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.media(chatId),
      });
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
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages(variables.targetChatId),
      });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.media(variables.targetChatId),
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useFindChatsMutation() {
  return useMutation({
    mutationFn: chatApi.findChats,
  });
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.createGroup,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useUpdateGroupDetailsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, body }: { chatId: string; body: FormData }) =>
      chatApi.updateGroupDetails(chatId, body),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
      void queryClient.invalidateQueries({
        queryKey: ['chatDetails', vars.chatId],
      });
    },
  });
}

export function useAddMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      chatId,
      members,
    }: {
      chatId: string;
      members: string[];
    }) => chatApi.addMembers(chatId, members),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['chatDetails', vars.chatId],
      });
      void queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      chatId,
      memberToBeRemoved,
    }: {
      chatId: string;
      memberToBeRemoved: string;
    }) => chatApi.removeMember(chatId, memberToBeRemoved),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['chatDetails', vars.chatId],
      });
      void queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useSetMemberAdminMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      chatId,
      memberId,
      makeAdmin,
    }: {
      chatId: string;
      memberId: string;
      makeAdmin: boolean;
    }) => chatApi.setMemberAdmin(chatId, { memberId, makeAdmin }),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({
        queryKey: ['chatDetails', vars.chatId],
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useLeaveGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId }: { chatId: string }) =>
      chatApi.leaveGroup(chatId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useMarkChatReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      chatId,
      lastReadMessageId,
    }: {
      chatId: string;
      lastReadMessageId?: string;
    }) => chatApi.markChatRead(chatId, { lastReadMessageId }),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.messages(vars.chatId),
      });
    },
  });
}

export function useMarkAllChatsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => chatApi.markAllChatsRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}
