import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as chatApi from '@/api/chat';
import { queryKeys } from '@/hooks/chat';

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
      void queryClient.invalidateQueries({ queryKey: ['chatDetails', vars.chatId] });
    },
  });
}

export function useAddMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, members }: { chatId: string; members: string[] }) =>
      chatApi.addMembers(chatId, members),
    onSuccess: (_data, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['chatDetails', vars.chatId] });
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
      void queryClient.invalidateQueries({ queryKey: ['chatDetails', vars.chatId] });
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
      void queryClient.invalidateQueries({ queryKey: ['chatDetails', vars.chatId] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}

export function useLeaveGroupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId }: { chatId: string }) => chatApi.leaveGroup(chatId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.chats });
    },
  });
}
