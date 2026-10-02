import { Types } from 'mongoose';
import * as chatRepo from '../../repositories/chat.js';
import { AppError } from '../../utils/AppError.js';

/**
 * Load a chat's member list and assert the acting user is one of them.
 *
 * Membership is a business rule, so it stays in the service; only the read and
 * the writes below belong to the repository. Both callers below need this exact
 * preamble, and the 403 is load-bearing — it is what stops a non-member from
 * writing `deletedFor` / `clearedFor` entries onto a chat they cannot see.
 */
const requireMembership = async (userId: string, chatId: string): Promise<void> => {
  const chat = await chatRepo.findByIdMembers(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  const isMember = chat.members.some((m) => m.toString() === userId);
  if (!isMember) throw new AppError(403, 'Forbidden');
};

export const deleteChatForMe = async (userId: string, chatId: string): Promise<void> => {
  await requireMembership(userId, chatId);
  await chatRepo.addToDeletedFor(chatId, userId);
};

export const clearChatForMe = async (userId: string, chatId: string): Promise<void> => {
  await requireMembership(userId, chatId);

  const userOid = new Types.ObjectId(userId);
  const now = new Date();

  // Replace the existing clearedFor entry if present, else push a new one.
  // Two steps on purpose — see `touchClearedFor`.
  const matched = await chatRepo.touchClearedFor(chatId, userOid, now);
  if (matched === 0) {
    await chatRepo.pushClearedFor(chatId, userOid, now);
  }
};