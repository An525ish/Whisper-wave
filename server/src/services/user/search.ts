import * as chatRepo from '../../repositories/chat.js';
import * as requestRepo from '../../repositories/request.js';
import * as userRepo from '../../repositories/user.js';
import type { SearchUserResult } from '../../types/index.js';

export const searchUsers = async (
  userId: string,
  name: string
): Promise<SearchUserResult[]> => {
  const myChats = await chatRepo.findDirectChatsForMember(userId);
  const myChatsMembers = myChats.flatMap(({ members }) => members);

  const [allOtherMembers, myRequests] = await Promise.all([
    userRepo.findExcludingIdsByName([...myChatsMembers, userId], name),
    requestRepo.findBySender(userId),
  ]);

  const receiverIds = myRequests.map((request) => request.receiver.toString());

  return allOtherMembers.map(({ _id, name: userName, avatar }) => ({
    _id,
    name: userName,
    avatar: avatar.url,
    isRequested: receiverIds.includes(_id.toString()),
  }));
};
