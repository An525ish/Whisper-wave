import type { CookieOptions, RequestHandler } from 'express';
import { cookieOptions } from '../config/cors.js';
import { adminService } from '../services/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import type { AdminLoginInput } from '../validators/admin.js';

const ADMIN_COOKIE = 'adminToken';
const adminCookieOptions: CookieOptions = {
  ...cookieOptions,
  maxAge: 1000 * 60 * 60 * 8,
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

export const listUsers: RequestHandler = catchAsync(async (_req, res) => {
  const users = await adminService.listUsers();
  res.status(200).json({ success: true, users });
});

export const listMessages: RequestHandler = catchAsync(async (_req, res) => {
  const messages = await adminService.listMessages();
  res.status(200).json({ success: true, messages });
});

export const listGroups: RequestHandler = catchAsync(async (_req, res) => {
  const groups = await adminService.listGroups();
  res.status(200).json({ success: true, groups });
});
