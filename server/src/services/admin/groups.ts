import * as chatReadRepo from '../../repositories/chatRead.js';
import * as chatRepo from '../../repositories/chat.js';
import * as messageRepo from '../../repositories/message.js';
import type { AdminGroupsPage } from '../../types/admin.js';
import { AppError } from '../../utils/AppError.js';
import { trimOptional } from '../../utils/normalize.js';
import type { AdminGroupsQuery } from '../../validators/admin.js';
import { parseBeforeCursor } from './shared.js';

export const listGroups = async (input: AdminGroupsQuery): Promise<AdminGroupsPage> => {
  const before = parseBeforeCursor(input.before);
  const limit = input.limit;
  const fetchLimit = limit + 1;
  const q = trimOptional(input.q);
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
