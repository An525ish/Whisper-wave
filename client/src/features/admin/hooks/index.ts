// Public API for admin hooks. Query/mutation hooks are grouped by resource in
// sibling files; the composed page view-models live in use*Page.ts. This file is
// a thin barrel only — no logic lives here (see CLAUDE.md §4, §12).

// Auth / session
export {
  useAdminMeQuery,
  useAdminLoginMutation,
  useAdminLogoutMutation,
} from '@/features/admin/hooks/useAdminAuth';

// Dashboard stats
export { useAdminStatsQuery } from '@/features/admin/hooks/useAdminStats';

// Users (+ impersonation)
export {
  useAdminUsersQuery,
  useAdminUserDetailQuery,
  useDeleteAdminUserMutation,
  useImpersonateMutation,
  useAdminImpersonationLogsQuery,
} from '@/features/admin/hooks/useAdminUsers';

// Messages
export {
  useAdminMessagesQuery,
  useDeleteAdminMessageMutation,
  useRetryAdminMessageMutation,
} from '@/features/admin/hooks/useAdminMessages';

// Groups
export {
  useAdminGroupsQuery,
  useDeleteAdminGroupMutation,
  useRemoveGroupMemberMutation,
} from '@/features/admin/hooks/useAdminGroups';

// Attachments / media
export {
  useAdminAttachmentsQuery,
  useDeleteAdminAttachmentsMutation,
} from '@/features/admin/hooks/useAdminAttachments';

// Activity feed / presence
export {
  useAdminActivityPresenceQuery,
  useAdminActivityEventsQuery,
} from '@/features/admin/hooks/useAdminActivity';

// Composed page view-models
export { useActivityPage } from '@/features/admin/hooks/useActivityPage';
export { useAttachmentsPage } from '@/features/admin/hooks/useAttachmentsPage';
export { useDashboardPage } from '@/features/admin/hooks/useDashboardPage';
export { useGroupsPage } from '@/features/admin/hooks/useGroupsPage';
export { useUsersPage } from '@/features/admin/hooks/useUsersPage';
export { useMessagesPage } from '@/features/admin/hooks/useMessagesPage';
