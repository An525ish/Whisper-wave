// Public API for admin hooks. Query/mutation hooks are grouped by resource in
// sibling files; the composed page view-models live in use*Page.ts. This file is
// a thin barrel only — no logic lives here (see CLAUDE.md §4, §12).

// Auth / session
export {
  useAdminMeQuery,
  useAdminLoginMutation,
  useAdminLogoutMutation,
} from './useAdminAuth';

// Dashboard stats
export { useAdminStatsQuery } from './useAdminStats';

// Users (+ impersonation)
export {
  useAdminUsersQuery,
  useAdminUserDetailQuery,
  useDeleteAdminUserMutation,
  useImpersonateMutation,
  useAdminImpersonationLogsQuery,
} from './useAdminUsers';

// Messages
export {
  useAdminMessagesQuery,
  useDeleteAdminMessageMutation,
  useRetryAdminMessageMutation,
} from './useAdminMessages';

// Groups
export {
  useAdminGroupsQuery,
  useDeleteAdminGroupMutation,
  useRemoveGroupMemberMutation,
} from './useAdminGroups';

// Attachments / media
export {
  useAdminAttachmentsQuery,
  useDeleteAdminAttachmentsMutation,
} from './useAdminAttachments';

// Activity feed / presence
export {
  useAdminActivityPresenceQuery,
  useAdminActivityEventsQuery,
} from './useAdminActivity';

// Rooms / bans / feature flags
export {
  useAdminRoomsQuery,
  useUpsertRoomMutation,
  useCloseInstanceMutation,
  useRoomBansQuery,
  useBanIdentityMutation,
  useLiftBanMutation,
  useFeatureFlagMutation,
} from './useAdminRooms';

// Reports queue
export {
  useAdminReportsQuery,
  useReviewReportMutation,
  useReportActionMutation,
} from './useAdminReports';

// Memes blocklist
export {
  useMemeBlocklistQuery,
  useBlockMemeMutation,
  useUnblockMemeMutation,
} from './useAdminMemes';

// Blocked words
export { useWordFilterQuery, useSaveWordFilterMutation } from './useAdminWordFilter';

// Moderation audit trail
export { useModAuditQuery } from './useAdminAudit';

// Composed page view-models
export { useActivityPage } from './useActivityPage';
export { useAttachmentsPage } from './useAttachmentsPage';
export { useDashboardPage } from './useDashboardPage';
export { useGroupsPage } from './useGroupsPage';
export { useUsersPage } from './useUsersPage';
export { useMessagesPage } from './useMessagesPage';
