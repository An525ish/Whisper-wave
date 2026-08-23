import * as chatRepo from '../../repositories/chat.js';
import type { FriendSummary } from '../../types/index.js';
import { AppError } from '../../utils/AppError.js';

export const getMyFriends = async (
  userId: string,
  chatId?: string
): Promise<FriendSummary[]> => {
  const chats = await chatRepo.findDirectChatsPopulated(userId);

  const friends = chats.flatMap(({ members }) => {
    const otherMembers = members.filter(
      (member) => member._id.toString() !== userId.toString()
    );

    return otherMembers.map((member) => ({
      _id: member._id,
      name: member.name,
      avatar: member.avatar?.url,
    }));
  });

  if (!chatId) return friends;

  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');

  return friends.filter(
    (friend) =>
      !chat.members.some(
        (member) => member.toString() === friend._id.toString()
      )
  );
};
