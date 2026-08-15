import { api } from '@/api/client';
import type { ApiSuccess } from '@/types';
import type { ProfileResponse, AuthDataResponse } from '@/types/auth';
export type { ProfileResponse, AuthDataResponse } from '@/types/auth';

export const getProfile = () => api.get<ProfileResponse>('/user/get-profile');

export const updateProfile = (formData: FormData) =>
  api.put<ProfileResponse>('/user/update-profile', formData);

export const signIn = (body: { username: string; password: string }) =>
  api.post<AuthDataResponse>('/auth/signin', body);

export const startSignUp = (body: {
  email: string;
  password: string;
  confirmPassword: string;
}) =>
  api.post<ApiSuccess & { data: { email: string } }>('/auth/signup/start', body);

export const resendSignUpOtp = (body: { email: string }) =>
  api.post<ApiSuccess>('/auth/signup/resend', body);

export const verifySignUpOtp = (body: {
  email: string;
  otp: string;
  username: string;
}) =>
  api.post<ApiSuccess & { data: { signupToken: string } }>(
    '/auth/signup/verify',
    body
  );

export const completeSignUp = (formData: FormData) =>
  api.post<AuthDataResponse>('/auth/signup/complete', formData);

export const signOut = () => api.post<ApiSuccess>('/auth/signout');

export const forgotPassword = (body: { email: string }) =>
  api.post<ApiSuccess>('/auth/forgot-password', body);

export const resetPassword = (body: { token: string; password: string }) =>
  api.post<ApiSuccess>('/auth/reset-password', body);

export const googleSignIn = (body: {
  credential?: string;
  accessToken?: string;
}) => api.post<AuthDataResponse>('/auth/google', body);
