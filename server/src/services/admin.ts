import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import * as chatRepo from '../repositories/chat.js';
import * as messageRepo from '../repositories/message.js';
import * as userRepo from '../repositories/user.js';
import type {
  AdminLoginResult,
  AdminStats,
  AdminUserListItem,
} from '../types/admin.js';
import { AppError } from '../utils/AppError.js';
import { generateAdminToken } from '../utils/token.js';
import type { AdminLoginInput } from '../validators/admin.js';
import { getPresenceSize } from './presence.js';

const secretsEqual = (provided: string, expected: string): boolean => {
  const providedBuf = Buffer.from(provided);
  const expectedBuf = Buffer.from(expected);
  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }
  return timingSafeEqual(providedBuf, expectedBuf);
};

export const login = async (
  input: AdminLoginInput
): Promise<AdminLoginResult> => {
  if (!env.ADMIN_SECRET) {
    throw new AppError(503, 'Admin login is not configured');
  }

  if (!secretsEqual(input.secretKey, env.ADMIN_SECRET)) {
    throw new AppError(401, 'Invalid admin credentials');
  }

  return { token: generateAdminToken() };
};

export const me = (): { isAdmin: true } => ({ isAdmin: true });

const DAY_MS = 24 * 60 * 60 * 1000;

const buildLast7DayBuckets = async (
  countByDay: (start: Date, end: Date) => Promise<{ _id: string; count: number }[]>
): Promise<{ labels: string[]; values: number[] }> => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end.getTime() - 6 * DAY_MS);
  start.setHours(0, 0, 0, 0);

  const rows = await countByDay(start, end);
  const byDay = new Map(rows.map((r) => [r._id, r.count]));
  const labels: string[] = [];
  const values: number[] = [];

  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start.getTime() + i * DAY_MS);
    const key = day.toISOString().slice(0, 10);
    labels.push(day.toLocaleDateString('en-US', { weekday: 'short' }));
    values.push(byDay.get(key) ?? 0);
  }

  return { labels, values };
};

export const getStats = async (): Promise<AdminStats> => {
  const [users, groups, chats, messages, newUsers, messageSeries] =
    await Promise.all([
      userRepo.countAll(),
      chatRepo.countGroups(),
      chatRepo.countAll(),
      messageRepo.countAll(),
      buildLast7DayBuckets(userRepo.countCreatedByDay),
      buildLast7DayBuckets(messageRepo.countCreatedByDay),
    ]);

  return {
    users,
    groups,
    chats,
    messages,
    onlineUsers: getPresenceSize(),
    seriesLabels: newUsers.labels,
    newUsersSeries: newUsers.values,
    messagesSeries: messageSeries.values,
  };
};

export const listUsers = async (): Promise<AdminUserListItem[]> =>
  userRepo.listForAdmin();

export const listMessages = async () => messageRepo.listForAdmin();

export const listGroups = async () => chatRepo.listGroupsForAdmin();
