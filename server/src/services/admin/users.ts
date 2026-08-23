import * as chatReadRepo from '../../repositories/chatRead.js';
import * as chatRepo from '../../repositories/chat.js';
import * as messageRepo from '../../repositories/message.js';
import * as requestRepo from '../../repositories/request.js';
import * as userRepo from '../../repositories/user.js';
import type { AdminUserListItem, AdminUsersPage } from '../../types/admin.js';
import { AppError } from '../../utils/AppError.js';
import type { AdminUsersQuery } from '../../validators/admin.js';
import { parseBeforeCursor } from './shared.js';

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
