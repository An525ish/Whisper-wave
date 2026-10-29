import { useMutation, useQueryClient } from '@tanstack/react-query';
import { runBeforeSignOut } from '@/shared/lib/api/authBridge';
import * as authApi from '../api/auth';
import type { ProfileResponse } from '../types';
import { useAuthStore } from '../store';
import { authKeys } from './queryKeys';

export function useSignInMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.signIn,
    onSuccess: (res) => {
      setUser(res.data);
      queryClient.setQueryData<ProfileResponse>(authKeys.profile, { success: true, user: res.data });
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

export function useUpdateSignupUsernameMutation() {
  return useMutation({
    mutationFn: authApi.updateSignupUsername,
  });
}

export function useCompleteSignUpMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.completeSignUp,
    onSuccess: (res) => {
      setUser(res.data);
      queryClient.setQueryData<ProfileResponse>(authKeys.profile, { success: true, user: res.data });
    },
  });
}

export function useSignOutMutation() {
  const clear = useAuthStore((s) => s.clear);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await runBeforeSignOut();
      return authApi.signOut();
    },
    onSettled: () => {
      clear();
      queryClient.clear();
    },
  });
}

export function useGoogleSignInMutation() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.googleSignIn,
    onSuccess: (res) => {
      setUser(res.data);
      queryClient.setQueryData<ProfileResponse>(authKeys.profile, { success: true, user: res.data });
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

/**
 * Own-profile update. `onUpdated` lets the caller refresh anything of its own
 * that shows this user's name/avatar (auth must not know about chats).
 */
export function useUpdateProfileMutation(onUpdated?: () => void) {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (res) => {
      if (res.user) {
        setUser(res.user);
        queryClient.setQueryData<ProfileResponse>(authKeys.profile, { success: true, user: res.user });
      }
      onUpdated?.();
    },
  });
}
