import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as authApi from '@/features/auth/api';
import { queryKeys } from '@/features/chat/queryKeys';
import { useAuthStore } from '@/features/auth/store';

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
