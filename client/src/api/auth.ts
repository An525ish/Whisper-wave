import { api } from '@/api/client';
import type { ApiSuccess } from '@/types';
import type {
  AuthDataResponse,
  GoogleSignInBody,
  ProfileResponse,
  ResendOtpBody,
  StartSignUpBody,
  StartSignUpResponse,
  UpdateSignupUsernameBody,
  VerifySignUpBody,
  VerifySignUpResponse,
} from '@/types/auth';

export type { ProfileResponse, AuthDataResponse } from '@/types/auth';

export const getProfile = () =>
  api.get<ProfileResponse>('/user/get-profile');

export const updateProfile = (formData: FormData) =>
  api.put<ProfileResponse>('/user/update-profile', formData);

export const signIn = (body: { username: string; password: string }) =>
  api.post<AuthDataResponse>('/auth/signin', body);

export const startSignUp = (body: StartSignUpBody) =>
  api.post<StartSignUpResponse>('/auth/signup/start', body);

export const resendSignUpOtp = (body: ResendOtpBody) =>
  api.post<ApiSuccess>('/auth/signup/resend', body);

export const verifySignUpOtp = (body: VerifySignUpBody) =>
  api.post<VerifySignUpResponse>('/auth/signup/verify', body);

export const updateSignupUsername = (body: UpdateSignupUsernameBody) =>
  api.patch<ApiSuccess>('/auth/signup/username', body);

export const completeSignUp = (formData: FormData) =>
  api.post<AuthDataResponse>('/auth/signup/complete', formData);

export const signOut = () =>
  api.post<ApiSuccess>('/auth/signout');

export const forgotPassword = (body: ResendOtpBody) =>
  api.post<ApiSuccess>('/auth/forgot-password', body);

export const resetPassword = (body: { token: string; password: string }) =>
  api.post<ApiSuccess>('/auth/reset-password', body);

export const googleSignIn = (body: GoogleSignInBody) =>
  api.post<AuthDataResponse>('/auth/google', body);

export const checkUsernameAvailability = (username: string) =>
  api.get<ApiSuccess & { data: { available: boolean } }>('/auth/username/check', { username });
