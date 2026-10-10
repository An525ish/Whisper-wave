import { Router } from 'express';
import {
  deleteGroup,
  deleteMessage,
  deleteAttachments,
  deleteUser,
  getActivityEvents,
  getActivityPresence,
  getImpersonationLogs,
  getStats,
  getUser,
  impersonateUser,
  listAttachments,
  listGroups,
  listMessages,
  listUsers,
  login,
  logout,
  me,
  removeGroupMember,
  retryMessage,
} from '../controllers/admin.js';
import { authLimiter, requireAdmin, validate } from '../middlewares/index.js';
import {
  listReportsController,
  reviewReportController,
} from '../controllers/admin/report.js';
import {
  banIdentityController,
  closeInstanceController,
  liftBanController,
  listAuditController,
  listRoomBansController,
  listRoomsAdminController,
  setFeatureController,
  upsertRoomController,
} from '../controllers/admin/rooms.js';
import {
  blockJokeController,
  listBlockedController,
  unblockJokeController,
} from '../controllers/admin/memes.js';
import {
  adminFeatureFlagSchema,
  adminRoomBanSchema,
  adminRoomCloseSchema,
  adminRoomUpsertSchema,
} from '../validators/rooms.js';
import { memeBlockSchema } from '../validators/memes.js';
import {
  adminActivityEventsQuerySchema,
  adminAttachmentsQuerySchema,
  adminDeleteAttachmentsSchema,
  adminIdParamSchema,
  adminImpersonationLogsQuerySchema,
  adminLoginSchema,
  adminRemoveMemberParamSchema,
  adminReportIdParamSchema,
  adminReportsQuerySchema,
  adminReportReviewSchema,
  adminUsersQuerySchema,
  adminGroupsQuerySchema,
  adminMessagesQuerySchema,
} from '../validators/admin.js';

export const adminRouter = Router();

adminRouter.post('/login', authLimiter, validate(adminLoginSchema), login);
adminRouter.post('/logout', logout);
// Soft session probe — returns { isAdmin } without 401 when no admin cookie.
adminRouter.get('/me', me);
adminRouter.get('/stats', requireAdmin, getStats);
adminRouter.get(
  '/users',
  requireAdmin,
  validate(adminUsersQuerySchema, 'query'),
  listUsers
);
adminRouter.get(
  '/users/:id',
  requireAdmin,
  validate(adminIdParamSchema, 'params'),
  getUser
);
adminRouter.get(
  '/messages',
  requireAdmin,
  validate(adminMessagesQuerySchema, 'query'),
  listMessages
);
adminRouter.get(
  '/groups',
  requireAdmin,
  validate(adminGroupsQuerySchema, 'query'),
  listGroups
);
adminRouter.get(
  '/attachments',
  requireAdmin,
  validate(adminAttachmentsQuerySchema, 'query'),
  listAttachments
);
adminRouter.get('/activity/presence', requireAdmin, getActivityPresence);
adminRouter.get(
  '/activity/events',
  requireAdmin,
  validate(adminActivityEventsQuerySchema, 'query'),
  getActivityEvents
);

// Moderation queue — abuse reports from the Whisper layer (user-submitted and
// auto-filed by the content filter). Admin only.
adminRouter.get(
  '/reports',
  requireAdmin,
  validate(adminReportsQuerySchema, 'query'),
  listReportsController
);
adminRouter.patch(
  '/reports/:id',
  requireAdmin,
  validate(adminReportIdParamSchema, 'params'),
  validate(adminReportReviewSchema, 'body'),
  reviewReportController
);

// Rooms — templates (the approval queue reads the unlisted ones), live
// instance close, bans, and the feature kill-switch. Admin only.
adminRouter.get('/rooms', requireAdmin, listRoomsAdminController);
adminRouter.put('/rooms', requireAdmin, validate(adminRoomUpsertSchema), upsertRoomController);
adminRouter.post(
  '/rooms/instances/:id/close',
  requireAdmin,
  validate(adminIdParamSchema, 'params'),
  validate(adminRoomCloseSchema),
  closeInstanceController
);
adminRouter.get('/room-bans', requireAdmin, listRoomBansController);
adminRouter.post(
  '/room-bans',
  requireAdmin,
  validate(adminRoomBanSchema),
  banIdentityController
);
adminRouter.delete(
  '/room-bans/:id',
  requireAdmin,
  validate(adminIdParamSchema, 'params'),
  liftBanController
);
adminRouter.post(
  '/features',
  requireAdmin,
  validate(adminFeatureFlagSchema),
  setFeatureController
);
adminRouter.get('/mod-audit', requireAdmin, listAuditController);

// Memes blocklist — provider joke ids hidden from every batch. Admin only.
adminRouter.get('/memes/blocklist', requireAdmin, listBlockedController);
adminRouter.post(
  '/memes/blocklist',
  requireAdmin,
  validate(memeBlockSchema),
  blockJokeController
);
adminRouter.delete('/memes/blocklist/:id', requireAdmin, unblockJokeController);

adminRouter.delete('/users/:id', requireAdmin, validate(adminIdParamSchema, 'params'), deleteUser);
adminRouter.delete('/groups/:id', requireAdmin, validate(adminIdParamSchema, 'params'), deleteGroup);
adminRouter.delete('/messages/:id', requireAdmin, validate(adminIdParamSchema, 'params'), deleteMessage);
adminRouter.delete('/attachments', requireAdmin, validate(adminDeleteAttachmentsSchema), deleteAttachments);
adminRouter.delete(
  '/groups/:id/members/:userId',
  requireAdmin,
  validate(adminRemoveMemberParamSchema, 'params'),
  removeGroupMember
);
adminRouter.post('/impersonate/:id', requireAdmin, validate(adminIdParamSchema, 'params'), impersonateUser);
adminRouter.post('/messages/:id/retry', requireAdmin, validate(adminIdParamSchema, 'params'), retryMessage);
adminRouter.get(
  '/impersonation-logs',
  requireAdmin,
  validate(adminImpersonationLogsQuerySchema, 'query'),
  getImpersonationLogs
);
