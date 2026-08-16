import { api } from '@/api/client';
import type { AdminStats, ApiSuccess } from '@/types';
import type {
  AdminActivityEventsPage,
  AdminActivityFilter,
  AdminActivityPresence,
  AdminAttachmentsPage,
  AdminImpersonationLogsPage,
  AttachmentKindFilter,
  AdminMeResponse,
  AdminUserRow,
  AdminUsersPage,
  AdminGroupsPage,
  AdminMessagesPage,
} from '@/types/admin';
export type { AdminMeResponse, AdminUser, AdminMessage, AdminGroup } from '@/types/admin';

export const adminLogin = (secretKey: string) =>
  api.post<AdminMeResponse>('/admin/login', { secretKey });

export const adminLogout = () => api.post<ApiSuccess>('/admin/logout');

export const adminMe = () => api.get<AdminMeResponse>('/admin/me');

export const getAdminStats = () =>
  api.get<ApiSuccess & { stats: AdminStats }>('/admin/stats');

export const USERS_PAGE_SIZE = 20;

export const getAdminUsers = (params: {
  limit?: number;
  before?: string;
  q?: string;
}) =>
  api.get<ApiSuccess & AdminUsersPage>('/admin/users', {
    limit: params.limit ?? USERS_PAGE_SIZE,
    before: params.before,
    q: params.q,
  });

export const getAdminUser = (id: string) =>
  api.get<ApiSuccess & { user: AdminUserRow }>(`/admin/users/${id}`);

export const GROUPS_PAGE_SIZE = 20;
export const MESSAGES_PAGE_SIZE = 20;

export const getAdminMessages = (params: {
  limit?: number;
  before?: string;
  status?: 'all' | 'sent' | 'failed';
  q?: string;
  senderId?: string;
}) =>
  api.get<ApiSuccess & AdminMessagesPage>('/admin/messages', {
    limit: params.limit ?? MESSAGES_PAGE_SIZE,
    before: params.before,
    status: params.status ?? 'all',
    q: params.q,
    senderId: params.senderId,
  });

export const getAdminGroups = (params: {
  limit?: number;
  before?: string;
  q?: string;
  memberId?: string;
}) =>
  api.get<ApiSuccess & AdminGroupsPage>('/admin/groups', {
    limit: params.limit ?? GROUPS_PAGE_SIZE,
    before: params.before,
    q: params.q,
    memberId: params.memberId,
  });

export const ACTIVITY_PAGE_SIZE = 20;

export const getAdminActivityPresence = () =>
  api.get<ApiSuccess & AdminActivityPresence>('/admin/activity/presence');

export const getAdminActivityEvents = (params: {
  limit?: number;
  before?: string;
  type: AdminActivityFilter;
}) =>
  api.get<ApiSuccess & AdminActivityEventsPage>('/admin/activity/events', {
    limit: params.limit ?? ACTIVITY_PAGE_SIZE,
    type: params.type,
    before: params.before,
  });

export const deleteAdminUser = (id: string) =>
  api.delete<ApiSuccess>(`/admin/users/${id}`);

export const deleteAdminGroup = (id: string) =>
  api.delete<ApiSuccess>(`/admin/groups/${id}`);

export const deleteAdminMessage = (id: string) =>
  api.delete<ApiSuccess>(`/admin/messages/${id}`);

export const removeAdminGroupMember = (groupId: string, userId: string) =>
  api.delete<ApiSuccess>(`/admin/groups/${groupId}/members/${userId}`);

export const impersonateUser = (id: string) =>
  api.post<ApiSuccess>(`/admin/impersonate/${id}`, {});

export const retryAdminMessage = (id: string) =>
  api.post<ApiSuccess>(`/admin/messages/${id}/retry`, {});

export const ATTACHMENTS_PAGE_SIZE = 24;

export const getAdminAttachments = (params: {
  limit?: number;
  before?: string;
  q?: string;
  senderId?: string;
  kind?: AttachmentKindFilter;
}) =>
  api.get<ApiSuccess & AdminAttachmentsPage>('/admin/attachments', {
    limit: params.limit ?? ATTACHMENTS_PAGE_SIZE,
    before: params.before,
    q: params.q,
    senderId: params.senderId,
    kind: params.kind ?? 'all',
  });

export const IMPERSONATION_LOGS_PAGE_SIZE = 20;

export const getImpersonationLogs = (params: { limit?: number; before?: string }) =>
  api.get<ApiSuccess & AdminImpersonationLogsPage>('/admin/impersonation-logs', {
    limit: params.limit ?? IMPERSONATION_LOGS_PAGE_SIZE,
    before: params.before,
  });
