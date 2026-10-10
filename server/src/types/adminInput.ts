import type { z } from 'zod';
import type {
  adminActivityEventsQuerySchema,
  adminAttachmentsQuerySchema,
  adminDeleteAttachmentsSchema,
  adminGroupsQuerySchema,
  adminIdParamSchema,
  adminImpersonationLogsQuerySchema,
  adminLoginSchema,
  adminMessagesQuerySchema,
  adminRemoveMemberParamSchema,
  adminReportReviewSchema,
  adminReportsQuerySchema,
  adminUsersQuerySchema,
} from '../validators/admin.js';
import type {
  adminFeatureFlagSchema,
  adminRoomBanSchema,
  adminRoomUpsertSchema,
} from '../validators/rooms.js';

// Validated admin request shapes. Schemas (validators/admin.ts) stay the single
// source of truth; types are derived here so services never import validators/.
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminIdParam = z.infer<typeof adminIdParamSchema>;
export type AdminRemoveMemberParam = z.infer<typeof adminRemoveMemberParamSchema>;
export type AdminActivityEventsQuery = z.infer<typeof adminActivityEventsQuerySchema>;
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
export type AdminGroupsQuery = z.infer<typeof adminGroupsQuerySchema>;
export type AdminMessagesQuery = z.infer<typeof adminMessagesQuerySchema>;
export type AdminAttachmentsQuery = z.infer<typeof adminAttachmentsQuerySchema>;
export type AdminImpersonationLogsQuery = z.infer<typeof adminImpersonationLogsQuerySchema>;
export type AdminDeleteAttachmentsBody = z.infer<typeof adminDeleteAttachmentsSchema>;
export type AdminReportsQuery = z.infer<typeof adminReportsQuerySchema>;
export type AdminReportReviewBody = z.infer<typeof adminReportReviewSchema>;
export type AdminRoomUpsertBody = z.infer<typeof adminRoomUpsertSchema>;
export type AdminRoomBanBody = z.infer<typeof adminRoomBanSchema>;
export type AdminFeatureFlagBody = z.infer<typeof adminFeatureFlagSchema>;
