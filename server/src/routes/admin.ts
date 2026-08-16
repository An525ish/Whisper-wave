import { Router } from 'express';
import {
  deleteGroup,
  deleteMessage,
  deleteUser,
  getActivityEvents,
  getActivityPresence,
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
  adminActivityEventsQuerySchema,
  adminAttachmentsQuerySchema,
  adminIdParamSchema,
  adminLoginSchema,
  adminRemoveMemberParamSchema,
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

adminRouter.delete('/users/:id', requireAdmin, validate(adminIdParamSchema, 'params'), deleteUser);
adminRouter.delete('/groups/:id', requireAdmin, validate(adminIdParamSchema, 'params'), deleteGroup);
adminRouter.delete('/messages/:id', requireAdmin, validate(adminIdParamSchema, 'params'), deleteMessage);
adminRouter.delete(
  '/groups/:id/members/:userId',
  requireAdmin,
  validate(adminRemoveMemberParamSchema, 'params'),
  removeGroupMember
);
adminRouter.post('/impersonate/:id', requireAdmin, validate(adminIdParamSchema, 'params'), impersonateUser);
adminRouter.post('/messages/:id/retry', requireAdmin, validate(adminIdParamSchema, 'params'), retryMessage);
