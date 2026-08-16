import { timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';
import * as chatReadRepo from '../repositories/chatRead.js';
import * as chatRepo from '../repositories/chat.js';
import * as messageRepo from '../repositories/message.js';
import * as requestRepo from '../repositories/request.js';
import * as userRepo from '../repositories/user.js';
import type {
  AdminActivityEvent,
  AdminActivityEventsPage,
  AdminActivityMessage,
  AdminActivityPresence,
  AdminActivitySignup,
  AdminLoginResult,
  AdminStats,
  AdminUserListItem,
  AdminUsersPage,
  AdminGroupsPage,
  AdminMessagesPage,
  AdminAttachmentsPage,
} from '../types/admin.js';
import { AppError } from '../utils/AppError.js';
import { buildLast7DayBuckets } from '../utils/statsBuckets.js';
import {
  generateAdminToken,
  generateImpersonationToken,
  verifyAdminToken,
} from '../utils/token.js';
import * as impersonationLogRepo from '../repositories/impersonationLog.js';
import type { ImpersonationLogPage } from '../repositories/impersonationLog.js';
import type { AdminLoginInput, AdminActivityEventsQuery, AdminUsersQuery, AdminGroupsQuery, AdminMessagesQuery, AdminAttachmentsQuery } from '../validators/admin.js';
import {
  getOnlineUserIds,
  getPresenceSize,
} from './presence.js';

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

export const me = (
  token: string | undefined
): { isAdmin: boolean } => {
  if (!token) return { isAdmin: false };
  try {
    verifyAdminToken(token);
    return { isAdmin: true };
  } catch {
    return { isAdmin: false };
  }
};

export const getStats = async (): Promise<AdminStats> => {
  const [users, groups, chats, messages, pendingRequests, newUsers, messageSeries, groupsBuckets, requestsBuckets] =
    await Promise.all([
      userRepo.countAll(),
      chatRepo.countGroups(),
      chatRepo.countAll(),
      messageRepo.countAll(),
      requestRepo.countPending(),
      buildLast7DayBuckets(userRepo.countCreatedByDay),
      buildLast7DayBuckets(messageRepo.countCreatedByDay),
      buildLast7DayBuckets(chatRepo.countGroupsCreatedByDay),
      buildLast7DayBuckets(requestRepo.countCreatedByDay),
    ]);

  return {
    users,
    groups,
    chats,
    messages,
    pendingRequests,
    onlineUsers: getPresenceSize(),
    seriesLabels: newUsers.labels,
    newUsersSeries: newUsers.values,
    messagesSeries: messageSeries.values,
    groupsSeries: groupsBuckets.values,
    requestsSeries: requestsBuckets.values,
  };
};

export const listUsers = async (input: AdminUsersQuery): Promise<AdminUsersPage> => {
  const before = input.before ? parseBeforeCursor(input.before) : undefined;
  const limit = input.limit;
  const fetchLimit = limit + 1;
  const q = input.q?.trim() || undefined;
  const isFirstPage = !before;

  const [rows, total] = await Promise.all([
    userRepo.listForAdminPage({ limit: fetchLimit, before, q }),
    isFirstPage ? userRepo.countForAdmin(q) : Promise.resolve(undefined),
  ]);

  const users = rows.slice(0, limit);
  const last = users[users.length - 1];
  const hasMore = rows.length > limit;

  return {
    users,
    nextCursor: hasMore && last ? new Date(last.createdAt).toISOString() : null,
    hasMore,
    ...(total !== undefined ? { total } : {}),
  };
};

export const getUser = async (id: string): Promise<AdminUserListItem> => {
  const user = await userRepo.findByIdForAdmin(id);
  if (!user) throw new AppError(404, 'User not found');
  return user;
};

export const listMessages = async (input: AdminMessagesQuery): Promise<AdminMessagesPage> => {
  const before = parseBeforeCursor(input.before);
  const limit = input.limit;
  const fetchLimit = limit + 1;
  const status = input.status;
  const q = input.q?.trim() || undefined;
  const senderId = input.senderId || undefined;
  const isFirstPage = !before;

  const [rows, total] = await Promise.all([
    messageRepo.listForAdminPage({ limit: fetchLimit, before, status, q, senderId }),
    isFirstPage ? messageRepo.countForAdmin({ status, q, senderId }) : Promise.resolve(undefined),
  ]);

  const messages = rows.slice(0, limit);
  const last = messages[messages.length - 1];
  const hasMore = rows.length > limit;

  return {
    messages,
    nextCursor:
      hasMore && last?.createdAt ? new Date(last.createdAt).toISOString() : null,
    hasMore,
    ...(total !== undefined ? { total } : {}),
  };
};

export const listGroups = async (input: AdminGroupsQuery): Promise<AdminGroupsPage> => {
  const before = parseBeforeCursor(input.before);
  const limit = input.limit;
  const fetchLimit = limit + 1;
  const q = input.q?.trim() || undefined;
  const memberId = input.memberId || undefined;
  const isFirstPage = !before;

  const [rows, total] = await Promise.all([
    chatRepo.listGroupsForAdminPage({ limit: fetchLimit, before, q, memberId }),
    isFirstPage ? chatRepo.countGroupsForAdmin(q, memberId) : Promise.resolve(undefined),
  ]);

  const groups = rows.slice(0, limit);
  const last = groups[groups.length - 1];
  const hasMore = rows.length > limit;

  return {
    groups,
    nextCursor: hasMore && last ? new Date(last.createdAt).toISOString() : null,
    hasMore,
    ...(total !== undefined ? { total } : {}),
  };
};

export const listAttachments = async (input: AdminAttachmentsQuery): Promise<AdminAttachmentsPage> => {
  const before = parseBeforeCursor(input.before);
  const limit = input.limit;
  const fetchLimit = limit + 1;
  const q = input.q?.trim() || undefined;
  const senderId = input.senderId || undefined;
  const kind = input.kind || 'all';
  const isFirstPage = !before;

  const [rows, total] = await Promise.all([
    messageRepo.listAttachmentsForAdmin({ limit: fetchLimit, before, q, senderId, kind }),
    isFirstPage ? messageRepo.countAttachmentsForAdmin({ q, senderId, kind }) : Promise.resolve(undefined),
  ]);

  const messages = rows.slice(0, limit);
  const last = messages[messages.length - 1];
  const hasMore = rows.length > limit;

  return {
    messages: messages as unknown as AdminAttachmentsPage['messages'],
    nextCursor: hasMore && last?.createdAt ? new Date(last.createdAt).toISOString() : null,
    hasMore,
    ...(total !== undefined ? { total } : {}),
  };
};

export const deleteUser = async (id: string): Promise<void> => {
  const user = await userRepo.findByIdLean(id);
  if (!user) throw new AppError(404, 'User not found');

  // Find all direct (non-group) chats the user is a member of so we can
  // cascade-delete their messages and read-state alongside the chat docs.
  const directChats = await chatRepo.findDirectChatsForMember(id);
  const directChatIds = directChats.map((c) => c._id.toString());

  await Promise.all([
    userRepo.deleteById(id),
    // Remove any pending friend requests involving this user.
    requestRepo.deleteByUser(id),
    // Wipe direct chat rooms + their messages + read records.
    ...directChatIds.flatMap((chatId) => [
      chatRepo.deleteById(chatId),
      messageRepo.deleteByChatId(chatId),
      chatReadRepo.deleteByChatId(chatId),
    ]),
    // Pull the user out of all group chats they're a member of.
    chatRepo.removeMemberFromAllGroups(id),
    // Delete any messages the user sent (group messages stay for history,
    // but direct messages are gone with the chat; group messages with a
    // dangling sender ref are acceptable in a soft-delete model).
    chatReadRepo.deleteByUserId(id),
  ]);
};

export const deleteGroup = async (id: string): Promise<void> => {
  const chat = await chatRepo.findByIdLean(id);
  if (!chat) throw new AppError(404, 'Group not found');
  if (!chat.groupChat) throw new AppError(400, 'Not a group chat');

  // Mirror what chatService.deleteGroup does so there are no orphans.
  await Promise.all([
    chatRepo.deleteById(id),
    messageRepo.deleteByChatId(id),
    chatReadRepo.deleteByChatId(id),
  ]);
};

export const deleteMessage = async (id: string): Promise<void> => {
  const deleted = await messageRepo.deleteById(id);
  if (!deleted) throw new AppError(404, 'Message not found');
};

export const retryMessage = async (
  id: string,
  emitFn: (event: string, members: string[], data: unknown) => void,
): Promise<void> => {
  const msg = await messageRepo.findByIdLean(id);
  if (!msg) throw new AppError(404, 'Message not found');
  if (msg.status !== 'failed') throw new AppError(400, 'Message is not in failed state');

  const chat = await chatRepo.findByIdLean(msg.chat.toString());
  if (!chat) throw new AppError(404, 'Chat not found');

  const memberIds = chat.members.map((m) => m.toString());

  // Re-emit the message to all chat members and mark it as sent.
  emitFn('NEW_MESSAGE', memberIds, {
    chatId: msg.chat.toString(),
    message: {
      _id: String(msg._id),
      content: msg.content,
      sender: msg.sender,
      chat: msg.chat,
      createdAt: msg.createdAt,
    },
  });

  await messageRepo.updateById(id, { status: 'sent' } as Parameters<typeof messageRepo.updateById>[1]);
};

export const removeGroupMember = async (
  groupId: string,
  userId: string
): Promise<void> => {
  const chat = await chatRepo.findByIdLean(groupId);
  if (!chat) throw new AppError(404, 'Group not found');
  if (!chat.groupChat) throw new AppError(400, 'Not a group chat');

  const nextMembers = chat.members.filter((m) => m.toString() !== userId);
  const nextAdmins = (chat.admins ?? []).filter((a) => a.toString() !== userId);
  await chatRepo.updateById(groupId, { members: nextMembers, admins: nextAdmins });
};

export const impersonateUser = async (
  userId: string,
  adminId: string
): Promise<string> => {
  const user = await userRepo.findByIdLean(userId);
  if (!user) throw new AppError(404, 'User not found');

  await impersonationLogRepo.create({
    adminId: adminId ?? 'admin',
    targetUserId: user._id,
    targetUsername: user.username,
    targetName: user.name,
    startedAt: new Date(),
  });

  return generateImpersonationToken(userId, adminId);
};

export const getImpersonationLogs = async (
  limit: number,
  before?: string
): Promise<ImpersonationLogPage> => {
  const beforeDate = before ? new Date(before) : undefined;
  return impersonationLogRepo.findPaginated(limit, beforeDate);
};

const ONLINE_AVATAR_LIMIT = 12;

const parseBeforeCursor = (before?: string): Date | undefined => {
  if (!before) return undefined;
  const date = new Date(before);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(400, 'Invalid cursor');
  }
  return date;
};

const toMessageEvent = (row: Awaited<ReturnType<typeof messageRepo.listRecentForActivity>>[number]): AdminActivityEvent => {
  const createdAt = row.createdAt ? new Date(row.createdAt) : new Date(0);
  return {
    kind: 'message',
    data: row as unknown as AdminActivityMessage,
    ts: createdAt.getTime(),
  };
};

const toSignupEvent = (row: AdminUserListItem): AdminActivityEvent => ({
  kind: 'signup',
  data: row as unknown as AdminActivitySignup,
  ts: new Date(row.createdAt).getTime(),
});

const cursorFromEvents = (events: AdminActivityEvent[]): string | null => {
  const last = events[events.length - 1];
  if (!last) return null;
  return new Date(last.ts).toISOString();
};

export const getActivityPresence = async (): Promise<AdminActivityPresence> => {
  const onlineIds = getOnlineUserIds().slice(0, ONLINE_AVATAR_LIMIT);
  const rawOnlineUsers =
    onlineIds.length > 0
      ? await userRepo.findManyByIdsNameAvatar(onlineIds)
      : [];

  return {
    onlineCount: getPresenceSize(),
    onlineUsers: rawOnlineUsers as AdminActivityPresence['onlineUsers'],
  };
};

export const getActivityEvents = async (
  input: AdminActivityEventsQuery
): Promise<AdminActivityEventsPage> => {
  const before = parseBeforeCursor(input.before);
  const limit = input.limit;
  const fetchLimit = limit + 1;

  if (input.type === 'messages') {
    const rows = await messageRepo.listRecentForActivity({ limit: fetchLimit, before });
    const events = rows.slice(0, limit).map(toMessageEvent);
    return {
      events,
      nextCursor: rows.length > limit ? cursorFromEvents(events) : null,
      hasMore: rows.length > limit,
    };
  }

  if (input.type === 'signups') {
    const rows = await userRepo.listRecentSignupsForActivity({ limit: fetchLimit, before });
    const events = rows.slice(0, limit).map(toSignupEvent);
    return {
      events,
      nextCursor: rows.length > limit ? cursorFromEvents(events) : null,
      hasMore: rows.length > limit,
    };
  }

  // Fetch generously from both collections and merge by timestamp.
  // We request `limit * 2 + 1` from each collection so that after merging
  // and slicing to `limit` we still reliably detect hasMore without
  // re-fetching, even when events cluster around the same timestamp.
  const bigFetch = limit * 2 + 1;
  const [messages, signups] = await Promise.all([
    messageRepo.listRecentForActivity({ limit: bigFetch, before }),
    userRepo.listRecentSignupsForActivity({ limit: bigFetch, before }),
  ]);

  const merged = [
    ...messages.map(toMessageEvent),
    ...signups.map(toSignupEvent),
  ].sort((a, b) => b.ts - a.ts);

  const events = merged.slice(0, limit);
  // hasMore is true when either collection still had rows beyond what we
  // returned, OR the merged result had more than limit items.
  const hasMore =
    merged.length > limit ||
    messages.length >= bigFetch ||
    signups.length >= bigFetch;

  // Cursor is the timestamp of the *oldest* event on this page. Using strict
  // `$lt` means the next page won't replay it even at millisecond ties.
  return {
    events,
    nextCursor: hasMore ? cursorFromEvents(events) : null,
    hasMore,
  };
};
