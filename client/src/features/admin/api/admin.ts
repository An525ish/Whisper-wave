import { api } from '@/shared/lib/api/client';
import type { ApiSuccess } from '@/shared/types';
import type { AdminStats } from '@/features/admin/types';
import type {
  AdminActivityEventsPage,
  ModAuditEntry,
  AdminReportsPage,
  AdminRoomBan,
  AdminRoomBanInput,
  AdminRoomRow,
  AdminRoomUpsert,
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
} from '@/features/admin/types';
export type { AdminMeResponse, AdminUser, AdminMessage, AdminGroup } from '@/features/admin/types';

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
  signupMethod?: 'all' | 'google' | 'email';
}) =>
  api.get<ApiSuccess & AdminUsersPage>('/admin/users', {
    limit: params.limit ?? USERS_PAGE_SIZE,
    before: params.before,
    q: params.q,
    signupMethod: params.signupMethod ?? 'all',
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

/** 'admin-logs' is a client-only tab state — server enum is ['all','messages','signups'] */
export type ServerActivityFilter = Exclude<AdminActivityFilter, 'admin-logs'>;

export const getAdminActivityEvents = (params: {
  limit?: number;
  before?: string;
  type: ServerActivityFilter;
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

export const deleteAdminAttachments = (messageIds: string[]) =>
  api.delete<ApiSuccess>('/admin/attachments', { messageIds });

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

export const listAdminRooms = () =>
  api.get<ApiSuccess & { rooms: AdminRoomRow[] }>('/admin/rooms');

export const upsertAdminRoom = (room: AdminRoomUpsert) =>
  api.put<ApiSuccess & { room: AdminRoomRow }>('/admin/rooms', room);

export const closeRoomInstance = (instanceId: string, reason?: string) =>
  api.post<ApiSuccess>(`/admin/rooms/instances/${instanceId}/close`, reason ? { reason } : {});

export const listRoomBans = () =>
  api.get<ApiSuccess & { bans: AdminRoomBan[] }>('/admin/room-bans');

export const banRoomIdentity = (ban: AdminRoomBanInput) =>
  api.post<ApiSuccess & { ban: AdminRoomBan }>('/admin/room-bans', ban);

export const liftRoomBan = (id: string) => api.delete<ApiSuccess>(`/admin/room-bans/${id}`);

export const setFeatureFlag = (feature: 'rooms' | 'games' | 'memes', enabled: boolean) =>
  api.post<ApiSuccess & { features: Record<'rooms' | 'games' | 'memes', boolean> }>('/admin/features', {
    feature,
    enabled,
  });

export const listAdminReports = (page = 1) =>
  api.get<{ success: boolean; data: AdminReportsPage }>('/admin/reports', { page });

export const reviewAdminReport = (id: string, reviewed: boolean) =>
  api.patch<ApiSuccess>(`/admin/reports/${id}`, { reviewed });

export const listModAudit = () =>
  api.get<{ success: boolean; data: { entries: ModAuditEntry[] } }>('/admin/mod-audit');
