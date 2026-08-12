import { Router } from 'express';
import {
  getStats,
  listGroups,
  listMessages,
  listUsers,
  login,
  logout,
  me,
} from '../controllers/admin.js';
import { authLimiter, requireAdmin, validate } from '../middlewares/index.js';
import { adminLoginSchema } from '../validators/admin.js';

export const adminRouter = Router();

adminRouter.post('/login', authLimiter, validate(adminLoginSchema), login);
adminRouter.post('/logout', logout);
// Soft session probe — returns { isAdmin } without 401 when no admin cookie.
adminRouter.get('/me', me);
adminRouter.get('/stats', requireAdmin, getStats);
adminRouter.get('/users', requireAdmin, listUsers);
adminRouter.get('/messages', requireAdmin, listMessages);
adminRouter.get('/groups', requireAdmin, listGroups);
