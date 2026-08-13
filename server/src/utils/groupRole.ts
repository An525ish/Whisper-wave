import { AppError } from './AppError.js';

export type GroupRole = 'creator' | 'admin' | 'member';

export type GroupAuthChat = {
  groupChat?: boolean;
  creator: { toString(): string };
  admins?: Array<{ toString(): string }>;
  members: Array<{ toString(): string }>;
};

const adminIdSet = (chat: GroupAuthChat): Set<string> =>
  new Set((chat.admins ?? []).map((id) => id.toString()));

export const getGroupRole = (
  userId: string,
  chat: GroupAuthChat
): GroupRole | null => {
  const uid = userId.toString();
  const isMember = chat.members.some((m) => m.toString() === uid);
  if (!isMember) return null;
  if (chat.creator.toString() === uid) return 'creator';
  if (adminIdSet(chat).has(uid)) return 'admin';
  return 'member';
};

export const isGroupModerator = (
  userId: string,
  chat: GroupAuthChat
): boolean => {
  const role = getGroupRole(userId, chat);
  return role === 'creator' || role === 'admin';
};

/** Delete any message in group (creator/admin); own only otherwise / in DMs. */
export const canDeleteMessage = (
  userId: string,
  chat: GroupAuthChat,
  senderId: string
): boolean => {
  if (senderId.toString() === userId.toString()) return true;
  if (!chat.groupChat) return false;
  return isGroupModerator(userId, chat);
};

export const assertCreator = (
  userId: string,
  chat: GroupAuthChat
): void => {
  if (getGroupRole(userId, chat) !== 'creator') {
    throw new AppError(
      403,
      'Only group creator is authorised to perform this action'
    );
  }
};

export const assertModerator = (
  userId: string,
  chat: GroupAuthChat
): void => {
  if (!isGroupModerator(userId, chat)) {
    throw new AppError(
      403,
      'Only group creator or admin is authorised to perform this action'
    );
  }
};

export const assertCanRemoveMember = (
  actorId: string,
  chat: GroupAuthChat,
  targetId: string
): void => {
  const actorRole = getGroupRole(actorId, chat);
  if (!actorRole || actorRole === 'member') {
    throw new AppError(
      403,
      'Only group creator or admin is authorised to perform this action'
    );
  }

  const target = targetId.toString();
  if (target === chat.creator.toString()) {
    throw new AppError(403, 'Cannot remove the group creator');
  }
  if (target === actorId.toString()) {
    throw new AppError(400, 'Use leave group to remove yourself');
  }

  if (actorRole === 'admin') {
    if (adminIdSet(chat).has(target)) {
      throw new AppError(403, 'Admins cannot remove other admins');
    }
  }
};
