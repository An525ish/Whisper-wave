import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as authApi from '@/api/auth';
import { queryKeys } from '@/hooks/chat';
import { useAuthStore } from '@/stores/auth';

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

export function useStartSignUpMutation() {
  return useMutation({
    mutationFn: authApi.startSignUp,
  });
}

export function useResendSignUpOtpMutation() {
  return useMutation({
    mutationFn: authApi.resendSignUpOtp,
  });
}

export function useVerifySignUpOtpMutation() {
  return useMutation({
    mutationFn: authApi.verifySignUpOtp,
  });
}

export function useCompleteSignUpMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.completeSignUp,
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

export function useForgotPasswordMutation() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: authApi.resetPassword,
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
