import { Types } from 'mongoose';
import { REFETCH_CHATS } from '../../constants/socket-events.js';
import * as chatRepo from '../../repositories/chat.js';
import * as chatReadRepo from '../../repositories/chatRead.js';
import * as messageRepo from '../../repositories/message.js';
import type {
  ChatAvatar,
  RealtimeNotify,
  UpdateGroupDetailsInput,
} from '../../types/chat.js';
import type { UploadableFile } from '../../types/message.js';
import { AppError } from '../../utils/AppError.js';
import { deleteFromCloudinary } from '../../utils/cloudinary.js';
import {
  assertCanRemoveMember,
  assertCreator,
  assertModerator,
} from '../../utils/groupRole.js';
import { uploadAvatarOrThrow } from './shared.js';

export const createGroupChat = async (
  userId: string,
  input: { name: string; members: string[]; bio?: string },
  avatarFile?: UploadableFile
): Promise<{ chat: unknown; notifications: RealtimeNotify[] }> => {
  const allMembers = [...input.members, userId];
  let avatar: ChatAvatar | undefined;

  if (avatarFile) {
    avatar = await uploadAvatarOrThrow(avatarFile);
  }

  const chat = await chatRepo.create({
    name: input.name,
    bio: input.bio,
    avatar,
    groupChat: true,
    creator: userId,
    members: allMembers,
  });

  await chatReadRepo.initForMembers(chat._id, allMembers);

  return {
    chat,
    notifications: [{ event: REFETCH_CHATS, members: allMembers }],
  };
};

export const updateGroupDetails = async (
  userId: string,
  chatId: string,
  input: UpdateGroupDetailsInput,
  avatarFile?: UploadableFile
): Promise<{ notifications: RealtimeNotify[] }> => {
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  if (!chat.groupChat) {
    throw new AppError(400, 'Only group chats can be updated');
  }

  assertModerator(userId, chat);

  const patch: {
    name?: string;
    bio?: string;
    avatar?: ChatAvatar;
  } = {};

  if (input.name !== undefined) patch.name = input.name;
  if (input.bio !== undefined) patch.bio = input.bio;

  if (avatarFile) {
    patch.avatar = await uploadAvatarOrThrow(avatarFile);
  }

  if (Object.keys(patch).length === 0) {
    throw new AppError(400, 'No group details to update');
  }

  const updated = await chatRepo.updateById(chatId, patch);

  if (avatarFile && chat.avatar?.publicId) {
    await deleteFromCloudinary([chat.avatar.publicId]);
  }

  return {
    notifications: [
      { event: REFETCH_CHATS, members: updated?.members ?? chat.members },
    ],
  };
};

export const addMembers = async (
  userId: string,
  chatId: string,
  members: string[]
): Promise<{ chat: unknown; notifications: RealtimeNotify[] }> => {
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  if (!chat.groupChat) {
    throw new AppError(400, 'Only group chats can have members added');
  }
  assertModerator(userId, chat);

  const existingMembers = new Set(chat.members.map((m) => m.toString()));
  for (const member of members) existingMembers.add(member.toString());

  const nextMembers = Array.from(existingMembers).map(
    (id) => new Types.ObjectId(id)
  );
  const updated = await chatRepo.updateById(chatId, { members: nextMembers });

  const newlyAdded = members.filter(
    (id) => !chat.members.some((m) => m.toString() === id)
  );
  if (newlyAdded.length > 0) {
    await chatReadRepo.initForMembers(chatId, newlyAdded);
  }

  return {
    chat: updated,
    notifications: [
      { event: REFETCH_CHATS, members: updated?.members ?? nextMembers },
    ],
  };
};

export const removeMember = async (
  userId: string,
  chatId: string,
  memberToBeRemoved: string
): Promise<{ notifications: RealtimeNotify[] }> => {
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  if (!chat.groupChat) {
    throw new AppError(400, 'Only group chats support removing members');
  }
  assertCanRemoveMember(userId, chat, memberToBeRemoved);

  const nextMembers = chat.members.filter(
    (member) => member.toString() !== memberToBeRemoved.toString()
  );
  const nextAdmins = (chat.admins ?? []).filter(
    (adminId) => adminId.toString() !== memberToBeRemoved.toString()
  );
  await chatRepo.updateById(chatId, {
    members: nextMembers,
    admins: nextAdmins,
  });

  return {
    notifications: [
      {
        event: REFETCH_CHATS,
        members: [...nextMembers, memberToBeRemoved],
      },
    ],
  };
};

export const setMemberAdmin = async (
  userId: string,
  chatId: string,
  memberId: string,
  makeAdmin: boolean
): Promise<{ notifications: RealtimeNotify[] }> => {
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  if (!chat.groupChat) {
    throw new AppError(400, 'Only group chats have admins');
  }
  assertCreator(userId, chat);

  const target = memberId.toString();
  if (target === chat.creator.toString()) {
    throw new AppError(400, 'Group creator already has full permissions');
  }

  const isMember = chat.members.some((m) => m.toString() === target);
  if (!isMember) {
    throw new AppError(400, 'User is not a member of this group');
  }

  const currentAdmins = new Set((chat.admins ?? []).map((id) => id.toString()));
  if (makeAdmin) currentAdmins.add(target);
  else currentAdmins.delete(target);

  await chatRepo.updateById(chatId, {
    admins: Array.from(currentAdmins).map((id) => new Types.ObjectId(id)),
  });

  return {
    notifications: [{ event: REFETCH_CHATS, members: chat.members }],
  };
};

export const leaveGroup = async (
  userId: string,
  chatId: string
): Promise<{ message: string; notifications: RealtimeNotify[] }> => {
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(400, 'No chat found');

  const remainingMembers = chat.members.filter(
    (member) => member.toString() !== userId.toString()
  );
  const message = `You left ${chat.name}`;

  if (remainingMembers.length === 0) {
    await Promise.all([
      chatRepo.deleteById(chatId),
      messageRepo.deleteByChatId(chatId),
      chatReadRepo.deleteByChatId(chatId),
    ]);
    return { message, notifications: [] };
  }

  const wasCreator = userId === chat.creator.toString();
  let nextAdmins = (chat.admins ?? []).filter(
    (adminId) => adminId.toString() !== userId.toString()
  );

  const patch: {
    members: typeof remainingMembers;
    creator?: (typeof remainingMembers)[number];
    admins: Types.ObjectId[];
  } = { members: remainingMembers, admins: nextAdmins };

  if (wasCreator) {
    const randomIndex = Math.floor(Math.random() * remainingMembers.length);
    const newCreator = remainingMembers[randomIndex];
    patch.creator = newCreator;
    // New creator should not remain listed as admin.
    nextAdmins = nextAdmins.filter(
      (adminId) => adminId.toString() !== newCreator.toString()
    );
    patch.admins = nextAdmins;
  }

  await chatRepo.updateById(chatId, patch);
  return {
    message,
    notifications: [{ event: REFETCH_CHATS, members: remainingMembers }],
  };
};

export const deleteGroup = async (
  userId: string,
  chatId: string
): Promise<{ message: string; notifications: RealtimeNotify[] }> => {
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  assertCreator(userId, chat);

  const members = [...chat.members];
  const name = chat.name;

  await Promise.all([
    chatRepo.deleteById(chatId),
    messageRepo.deleteByChatId(chatId),
    chatReadRepo.deleteByChatId(chatId),
  ]);

  return {
    message: `${name} deleted successfully`,
    notifications: [{ event: REFETCH_CHATS, members }],
  };
};
