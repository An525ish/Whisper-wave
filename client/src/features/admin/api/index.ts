import { api } from '@/api/client';
import type { AdminStats, ApiSuccess, User } from '@/shared/types';

export type AdminMeResponse = ApiSuccess & { isAdmin: boolean };

export type AdminUser = User & {
  createdAt?: string;
  friendsCount?: number;
  groupsCount?: number;
};

export type AdminMessage = {
  _id: string;
  content?: string;
  sender: { _id: string; name?: string };
  chat?: string;
  createdAt?: string;
  attachments?: unknown[];
};

export type AdminGroup = {
  _id: string;
  name: string;
  groupChat: boolean;
  members?: { _id: string; name?: string }[];
  creator?: { _id: string; name?: string };
  createdAt?: string;
  totalMessages?: number;
};

export const adminLogin = (secretKey: string) =>
  api.post<AdminMeResponse>('/admin/login', { secretKey });

export const adminLogout = () => api.post<ApiSuccess>('/admin/logout');

export const adminMe = () => api.get<AdminMeResponse>('/admin/me');

export const getAdminStats = () =>
  api.get<ApiSuccess & { stats: AdminStats }>('/admin/stats');

export const getAdminUsers = () =>
  api.get<ApiSuccess & { users: AdminUser[] }>('/admin/users');

export const getAdminMessages = () =>
  api.get<ApiSuccess & { messages: AdminMessage[] }>('/admin/messages');

export const getAdminGroups = () =>
  api.get<ApiSuccess & { groups: AdminGroup[] }>('/admin/groups');
