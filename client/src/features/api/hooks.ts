import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import * as authApi from '@/api/auth';
import * as chatApi from '@/api/chat';
import { queryKeys } from '@/api/chat';
import { ApiError } from '@/api/client';
import { useAuthStore } from '@/stores/auth';
import { isValidChatId } from '@/utils/helper';

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
