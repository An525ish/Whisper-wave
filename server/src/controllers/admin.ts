import type { CookieOptions, RequestHandler } from 'express';
import type { Server } from 'socket.io';
import { getMemberSockets } from '../services/index.js';
import { cookieOptions } from '../config/cors.js';
import { adminService } from '../services/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import type {
  AdminActivityEventsQuery,
  AdminAttachmentsQuery,
  AdminIdParam,
  AdminImpersonationLogsQuery,
  AdminLoginInput,
  AdminRemoveMemberParam,
  AdminUsersQuery,
  AdminGroupsQuery,
  AdminMessagesQuery,
} from '../validators/admin.js';

const ADMIN_COOKIE = 'adminToken';
const ACCESS_COOKIE = 'accessToken';

const adminCookieOptions: CookieOptions = {
  ...cookieOptions,
  maxAge: 1000 * 60 * 60 * 8,
};

const impersonateCookieOptions: CookieOptions = {
  ...cookieOptions,
  maxAge: 1000 * 60 * 60 * 2,
};

export const login: RequestHandler = catchAsync(async (req, res) => {
  const result = await adminService.login(req.body as AdminLoginInput);

  res
    .status(200)
    .cookie(ADMIN_COOKIE, result.token, adminCookieOptions)
    .json({ success: true, isAdmin: true });
});

export const logout: RequestHandler = catchAsync(async (_req, res) => {
  res
    .status(200)
    .clearCookie(ADMIN_COOKIE, adminCookieOptions)
    .json({ success: true });
});

export const me: RequestHandler = catchAsync(async (req, res) => {
  const token = (req.cookies as { adminToken?: string } | undefined)?.adminToken;
  const result = adminService.me(token);
  res.status(200).json({ success: true, isAdmin: result.isAdmin });
});

export const getStats: RequestHandler = catchAsync(async (_req, res) => {
  const stats = await adminService.getStats();
  res.status(200).json({ success: true, stats });
});

export const listUsers: RequestHandler = catchAsync(async (req, res) => {
  const query = (req as typeof req & { validatedQuery: AdminUsersQuery }).validatedQuery;
  const page = await adminService.listUsers(query);
  res.status(200).json({ success: true, ...page });
});

export const getUser: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params as AdminIdParam;
  const user = await adminService.getUser(id);
  res.status(200).json({ success: true, user });
});

export const listMessages: RequestHandler = catchAsync(async (req, res) => {
  const query = (req as typeof req & { validatedQuery: AdminMessagesQuery }).validatedQuery;
  const page = await adminService.listMessages(query);
  res.status(200).json({ success: true, ...page });
});

export const listGroups: RequestHandler = catchAsync(async (req, res) => {
  const query = (req as typeof req & { validatedQuery: AdminGroupsQuery }).validatedQuery;
  const page = await adminService.listGroups(query);
  res.status(200).json({ success: true, ...page });
});

export const listAttachments: RequestHandler = catchAsync(async (req, res) => {
  const query = (req as typeof req & { validatedQuery: AdminAttachmentsQuery }).validatedQuery;
  const page = await adminService.listAttachments(query);
  res.status(200).json({ success: true, ...page });
});

export const deleteUser: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params as AdminIdParam;
  await adminService.deleteUser(id);
  res.status(200).json({ success: true });
});

export const deleteGroup: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params as AdminIdParam;
  await adminService.deleteGroup(id);
  res.status(200).json({ success: true });
});

export const deleteMessage: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params as AdminIdParam;
  await adminService.deleteMessage(id);
  res.status(200).json({ success: true });
});

export const removeGroupMember: RequestHandler = catchAsync(async (req, res) => {
  const { id, userId } = req.params as AdminRemoveMemberParam;
  await adminService.removeGroupMember(id, userId);
  res.status(200).json({ success: true });
});

export const impersonateUser: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params as AdminIdParam;
  const token = await adminService.impersonateUser(id, 'admin');

  res
    .status(200)
    .cookie(ACCESS_COOKIE, token, impersonateCookieOptions)
    .json({ success: true });
});

export const getImpersonationLogs: RequestHandler = catchAsync(async (req, res) => {
  const query = (req as typeof req & { validatedQuery: AdminImpersonationLogsQuery }).validatedQuery;
  const page = await adminService.getImpersonationLogs(query.limit, query.before);
  res.status(200).json({ success: true, ...page });
});

export const getActivityPresence: RequestHandler = catchAsync(async (_req, res) => {
  const presence = await adminService.getActivityPresence();
  res.status(200).json({ success: true, ...presence });
});

export const getActivityEvents: RequestHandler = catchAsync(async (req, res) => {
  const query = (req as typeof req & { validatedQuery: AdminActivityEventsQuery }).validatedQuery;
  const page = await adminService.getActivityEvents(query);
  res.status(200).json({ success: true, ...page });
});

export const retryMessage: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params as AdminIdParam;
  const io = req.app.get('io') as Server | undefined;

  const emitFn = (event: string, memberIds: string[], data: unknown) => {
    if (!io) return;
    const socketIds = getMemberSockets(memberIds);
    if (socketIds.length > 0) io.to(socketIds).emit(event, data);
  };

  await adminService.retryMessage(id, emitFn);
  res.status(200).json({ success: true });
});
