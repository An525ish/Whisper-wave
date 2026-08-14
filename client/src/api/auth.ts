import { api } from '@/api/client';
import type { ApiSuccess } from '@/types';
import type { ProfileResponse, AuthDataResponse } from '@/types/auth';
export type { ProfileResponse, AuthDataResponse } from '@/types/auth';

export const getProfile = () => api.get<ProfileResponse>('/user/get-profile');

export const updateProfile = (formData: FormData) =>
  api.put<ProfileResponse>('/user/update-profile', formData);

export const signIn = (body: { username: string; password: string }) =>
  api.post<AuthDataResponse>('/auth/signin', body);

export const signUp = (formData: FormData) =>
  api.post<AuthDataResponse>('/auth/signup', formData);

export const signOut = () => api.post<ApiSuccess>('/auth/signout');
