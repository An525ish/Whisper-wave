import { Types } from 'mongoose';
import { REFETCH_CHATS } from '../constants/socket-events.js';
import { Chat } from '../models/chat.js';
import { Message } from '../models/message.js';
import type {
  ChatListItem,
  ChatNotificationInput,
  FindChatItem,
  PopulatedMember,
  RealtimeNotify,
} from '../types/chat.js';
import { AppError } from '../utils/AppError.js';

const assertCreator = (userId: string, creatorId: { toString(): string }): void => {
  if (userId !== creatorId.toString()) {
    throw new AppError(
      401,
      'Only group creator is authorised to perform this action'
    );
  }
};

export const createGroupChat = async (
  userId: string,
  name: string,
  members: string[]
): Promise<{ chat: unknown; notifications: RealtimeNotify[] }> => {
  const allMembers = [...members, userId];
  const chat = await Chat.create({
    name,
    groupChat: true,
    creator: userId,
    members: allMembers,
  });

  return {
    chat,
    notifications: [{ event: REFETCH_CHATS, members: allMembers }],
  };
};

export const updateGroupDetails = async (
  userId: string,
  chatId: string,
  name: string
): Promise<{ notifications: RealtimeNotify[] }> => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');

  assertCreator(userId, chat.creator);
  chat.name = name;
  await chat.save();

  return {
    notifications: [{ event: REFETCH_CHATS, members: chat.members }],
  };
};

export const getMyChats = async (
  userId: string,
  page: number
): Promise<{ data: ChatListItem[]; totalPages: number }> => {
  const resultPerPage = 20;

  const [chats, totalChats] = await Promise.all([
    Chat.find({ members: userId })
      .populate('members', 'name username email avatar')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name' },
      })
      .sort({ updatedAt: -1 })
      .skip((page - 1) * resultPerPage)
      .limit(resultPerPage)
      .lean(),
    Chat.countDocuments({ members: userId }),
  ]);

  const data = chats.map(({ _id, name, members, groupChat, lastMessage }) => {
    const typedMembers = members as unknown as PopulatedMember[];
    const otherMembers = typedMembers.filter(
      (member) => member._id.toString() !== userId.toString()
    );

    return {
      _id,
      groupChat: Boolean(groupChat),
      name: groupChat ? name : otherMembers[0]?.name || 'Unknown',
      avatar: groupChat
        ? typedMembers
            .slice(0, 3)
            .map((member) => member.avatar?.url)
            .filter(Boolean)
        : [otherMembers[0]?.avatar?.url].filter(Boolean),
      members: otherMembers.map((member) => member._id),
      lastMessage,
    };
  });

  return {
    data,
    totalPages: Math.ceil(totalChats / resultPerPage) || 0,
  };
};

export const findChats = async (
  userId: string,
  userIds: string[],
  notifications: ChatNotificationInput[]
): Promise<FindChatItem[]> => {
  const chats = await Chat.find({
    _id: { $in: userIds },
    members: userId,
  }).populate('members', 'name avatar');

  const notificationMap = new Map(
    notifications.map((n) => [n.chatId, n.count])
  );

  return chats.map(({ _id, name, members, groupChat }) => {
    const typedMembers = members as unknown as PopulatedMember[];
    const otherMembers = typedMembers.filter(
      (member) => member._id.toString() !== userId.toString()
    );

    return {
      _id,
      groupChat,
      name: groupChat ? name : otherMembers[0]?.name || 'Unknown',
      avatar: groupChat ? null : [otherMembers[0]?.avatar?.url || ''],
      notificationCount: notificationMap.get(_id.toString()) || 0,
    };
  });
};

export const getChatDetails = async (
  userId: string,
  chatId: string,
  shouldPopulate: boolean
): Promise<Record<string, unknown>> => {
  let chat: Record<string, unknown> | null = null;

  if (shouldPopulate) {
    chat = (await Chat.findById(chatId)
      .populate('members', 'name avatar')
      .populate('creator', 'name avatar')
      .lean()) as Record<string, unknown> | null;
  } else {
    chat = (await Chat.findById(chatId).lean()) as Record<string, unknown> | null;
  }

  if (!chat) throw new AppError(400, 'No chat found');

  if (shouldPopulate) {
    const typedMembers = chat.members as PopulatedMember[];
    const creator = chat.creator as PopulatedMember & {
      avatar?: { url?: string } | string;
    };
    const otherMembers = typedMembers.filter(
      (member) => member._id.toString() !== userId.toString()
    );

    if (
      creator?.avatar &&
      typeof creator.avatar === 'object' &&
      creator.avatar.url
    ) {
      chat.creator = { ...creator, avatar: creator.avatar.url };
    }

    chat.name = chat.groupChat ? chat.name : otherMembers[0]?.name || 'Unknown';
    chat.avatar = chat.groupChat
      ? null
      : [otherMembers[0]?.avatar?.url || ''];
    chat.members = typedMembers.map(({ _id, avatar, ...rest }) => ({
      ...rest,
      _id,
      avatar: avatar?.url,
      isCreator: _id.toString() === creator._id.toString(),
    }));
  }

  return chat;
};

export const addMembers = async (
  userId: string,
  chatId: string,
  members: string[]
): Promise<{ chat: unknown; notifications: RealtimeNotify[] }> => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  assertCreator(userId, chat.creator);

  const existingMembers = new Set(chat.members.map((m) => m.toString()));
  for (const member of members) existingMembers.add(member.toString());

  chat.members = Array.from(existingMembers).map(
    (id) => new Types.ObjectId(id)
  ) as typeof chat.members;
  await chat.save();

  return {
    chat,
    notifications: [{ event: REFETCH_CHATS, members: chat.members }],
  };
};

export const removeMember = async (
  userId: string,
  chatId: string,
  memberToBeRemoved: string
): Promise<{ notifications: RealtimeNotify[] }> => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  assertCreator(userId, chat.creator);

  chat.members = chat.members.filter(
    (member) => member.toString() !== memberToBeRemoved.toString()
  ) as typeof chat.members;
  await chat.save();

  return {
    notifications: [
      {
        event: REFETCH_CHATS,
        members: [...chat.members, memberToBeRemoved],
      },
    ],
  };
};

export const leaveGroup = async (
  userId: string,
  chatId: string
): Promise<{ message: string; notifications: RealtimeNotify[] }> => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new AppError(400, 'No chat found');

  const remainingMembers = chat.members.filter(
    (member) => member.toString() !== userId.toString()
  );
  const message = `You left ${chat.name}`;

  if (remainingMembers.length === 0) {
    await Promise.all([chat.deleteOne(), Message.deleteMany({ chat: chatId })]);
    return { message, notifications: [] };
  }

  const wasCreator = userId === chat.creator.toString();
  chat.members = remainingMembers as typeof chat.members;

  if (wasCreator) {
    const randomIndex = Math.floor(Math.random() * remainingMembers.length);
    chat.creator = remainingMembers[randomIndex];
  }

  await chat.save();
  return {
    message,
    notifications: [{ event: REFETCH_CHATS, members: chat.members }],
  };
};

export const deleteGroup = async (
  userId: string,
  chatId: string
): Promise<{ message: string; notifications: RealtimeNotify[] }> => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  assertCreator(userId, chat.creator);

  const members = [...chat.members];
  const name = chat.name;

  await Promise.all([chat.deleteOne(), Message.deleteMany({ chat: chatId })]);

  return {
    message: `${name} deleted successfully`,
    notifications: [{ event: REFETCH_CHATS, members }],
  };
};

export const getMedia = async (userId: string, chatId: string) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new AppError(400, 'No chat found');

  const isMember = chat.members.some(
    (member) => member.toString() === userId.toString()
  );
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  const messages = await Message.find({
    chat: chatId,
    attachments: { $exists: true, $not: { $size: 0 } },
  }).sort({ updatedAt: -1 });

  return messages.flatMap((msg) => msg.attachments);
};
