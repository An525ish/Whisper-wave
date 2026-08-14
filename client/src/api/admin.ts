import { api } from '@/api/client';
import type { AdminStats, ApiSuccess } from '@/types';
import type { AdminMeResponse, AdminUser, AdminMessage, AdminGroup } from '@/types/admin';
export type { AdminMeResponse, AdminUser, AdminMessage, AdminGroup } from '@/types/admin';

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
