import { Types } from 'mongoose';
import { Chat } from '../../models/chat.js';
import { AppError } from '../../utils/AppError.js';

export const deleteChatForMe = async (userId: string, chatId: string): Promise<void> => {
  const chat = await Chat.findById(chatId).select('members').lean();
  if (!chat) throw new AppError(404, 'Chat not found');
  const isMember = chat.members.some((m) => m.toString() === userId);
  if (!isMember) throw new AppError(403, 'Forbidden');
  await Chat.findByIdAndUpdate(chatId, { $addToSet: { deletedFor: userId } });
};

export const clearChatForMe = async (userId: string, chatId: string): Promise<void> => {
  const chat = await Chat.findById(chatId).select('members').lean();
  if (!chat) throw new AppError(404, 'Chat not found');
  const isMember = chat.members.some((m) => m.toString() === userId);
  if (!isMember) throw new AppError(403, 'Forbidden');

  const userOid = new Types.ObjectId(userId);
  const now = new Date();

  // Upsert: replace existing clearedFor entry if present, else push a new one
  const updated = await Chat.updateOne(
    { _id: chatId, 'clearedFor.user': userOid },
    { $set: { 'clearedFor.$.at': now } },
  );
  if (updated.matchedCount === 0) {
    await Chat.updateOne(
      { _id: chatId },
      { $push: { clearedFor: { user: userOid, at: now } } },
    );
  }
};
