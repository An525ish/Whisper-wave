import { api } from '@/api/client';
import type { AdminStats, ApiSuccess } from '@/shared/types';

export type AdminMeResponse = ApiSuccess & { isAdmin: boolean };

export const adminLogin = (secretKey: string) =>
  api.post<AdminMeResponse>('/admin/login', { secretKey });

export const adminLogout = () => api.post<ApiSuccess>('/admin/logout');

export const adminMe = () => api.get<AdminMeResponse>('/admin/me');

export const getAdminStats = () =>
  api.get<ApiSuccess & { stats: AdminStats }>('/admin/stats');

export const getAdminUsers = () => api.get('/admin/users');

export const getAdminMessages = () => api.get('/admin/messages');

export const getAdminGroups = () => api.get('/admin/groups');
