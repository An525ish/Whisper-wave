import { Types } from 'mongoose';
import { REFETCH_CHATS } from '../../constants/socket-events.js';
import { GROUP_MAX_MEMBERS } from '../../constants/chat.js';
import * as chatRepo from '../../repositories/chat.js';
import * as chatReadRepo from '../../repositories/chatRead.js';
import * as messageRepo from '../../repositories/message.js';
import type {
  AddGroupMembersInput,
  ChatAvatar,
  ChatMutationMessageResult,
  ChatMutationResult,
  CreateGroupChatServiceInput,
  DeleteGroupInput,
  LeaveGroupInput,
  RealtimeNotificationsResult,
  RemoveGroupMemberInput,
  SetGroupMemberAdminInput,
  UpdateGroupDetailsServiceInput,
} from '../../types/chat.js';
import { AppError } from '../../utils/AppError.js';
import { deleteFromR2 } from '../../utils/storage.js';
import {
  assertCanRemoveMember,
  assertCreator,
  assertModerator,
} from '../../utils/groupRole.js';
import { uploadAvatarOrThrow } from './shared.js';

export const createGroupChat = async (
  input: CreateGroupChatServiceInput
): Promise<ChatMutationResult> => {
  const { userId, input: group, avatarFile } = input;
  const allMembers = [...group.members, userId];
  let avatar: ChatAvatar | undefined;

  if (avatarFile) {
    avatar = await uploadAvatarOrThrow(avatarFile);
  }

  const chat = await chatRepo.create({
    name: group.name,
    bio: group.bio,
    avatar,
    groupChat: true,
    creator: userId,
    members: allMembers,
  });

  await chatReadRepo.initForMembers(chat._id, allMembers);

  return {
    chat,
    notifications: [
      {
        event: REFETCH_CHATS,
        chatId: String(chat._id),
        data: { chatId: String(chat._id) },
      },
    ],
  };
};

export const updateGroupDetails = async (
  input: UpdateGroupDetailsServiceInput
): Promise<RealtimeNotificationsResult> => {
  const { userId, chatId, input: details, avatarFile } = input;
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

  if (details.name !== undefined) patch.name = details.name;
  if (details.bio !== undefined) patch.bio = details.bio;

  const avatar = avatarFile ? await uploadAvatarOrThrow(avatarFile) : undefined;
  if (avatar) patch.avatar = avatar;

  if (Object.keys(patch).length === 0) {
    throw new AppError(400, 'No group details to update');
  }

  await chatRepo.updateById(chatId, patch);

  if (avatarFile && chat.avatar?.publicId) {
    await deleteFromR2(chat.avatar.publicId);
  }

  return {
    notifications: [
      { event: REFETCH_CHATS, chatId, data: { chatId } },
    ],
  };
};

export const addMembers = async (
  input: AddGroupMembersInput
): Promise<ChatMutationResult> => {
  const { userId, chatId, members } = input;
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  if (!chat.groupChat) {
    throw new AppError(400, 'Only group chats can have members added');
  }
  assertModerator(userId, chat);

  const existingMembers = new Set(chat.members.map((m) => m.toString()));
  for (const member of members) existingMembers.add(member.toString());

  if (existingMembers.size > GROUP_MAX_MEMBERS) {
    throw new AppError(400, `Group cannot exceed ${GROUP_MAX_MEMBERS} members`);
  }

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
    chat: updated ?? chat,
    notifications: [
      { event: REFETCH_CHATS, chatId, data: { chatId } },
    ],
  };
};

export const removeMember = async (
  input: RemoveGroupMemberInput
): Promise<RealtimeNotificationsResult> => {
  const { userId, chatId, memberToBeRemoved } = input;
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
      { event: REFETCH_CHATS, chatId, data: { chatId } },
    ],
  };
};

export const setMemberAdmin = async (
  input: SetGroupMemberAdminInput
): Promise<RealtimeNotificationsResult> => {
  const { userId, chatId, memberId, makeAdmin } = input;
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
    notifications: [{ event: REFETCH_CHATS, chatId, data: { chatId } }],
  };
};

export const leaveGroup = async (
  input: LeaveGroupInput
): Promise<ChatMutationMessageResult> => {
  const { userId, chatId } = input;
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
    const matched = input.newCreatorId
      ? remainingMembers.find((m) => m.toString() === input.newCreatorId)
      : undefined;
    const newCreator = matched ?? remainingMembers[Math.floor(Math.random() * remainingMembers.length)];
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
    notifications: [{ event: REFETCH_CHATS, chatId, data: { chatId } }],
  };
};

export const deleteGroup = async (
  input: DeleteGroupInput
): Promise<ChatMutationMessageResult> => {
  const { userId, chatId } = input;
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  assertCreator(userId, chat);

  const name = chat.name;
  const memberIds = chat.members.map(String);

  await Promise.all([
    chatRepo.deleteById(chatId),
    messageRepo.deleteByChatId(chatId),
    chatReadRepo.deleteByChatId(chatId),
  ]);

  return {
    message: `${name} deleted successfully`,
    memberIds,
    notifications: [{ event: REFETCH_CHATS, chatId, data: { chatId } }],
  };
};
