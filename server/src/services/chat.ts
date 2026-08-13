import { Types } from 'mongoose';
import { CHAT_READ, REFETCH_CHATS } from '../constants/socket-events.js';
import * as chatRepo from '../repositories/chat.js';
import * as chatReadRepo from '../repositories/chatRead.js';
import * as messageRepo from '../repositories/message.js';
import type {
  ChatAvatar,
  ChatListItem,
  ChatNotificationInput,
  ChatSharedContent,
  ChatSharedLink,
  FindChatItem,
  MarkChatReadResult,
  PopulatedMember,
  RealtimeNotify,
  UpdateGroupDetailsInput,
} from '../types/chat.js';
import type { UploadableFile } from '../types/message.js';
import { AppError } from '../utils/AppError.js';
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from '../utils/cloudinary.js';

const URL_IN_TEXT =
  /https?:\/\/[^\s<>"'`{}|\\^[\]]+/gi;

const extractUniqueLinks = (
  messages: Array<{ _id: Types.ObjectId; content?: string; createdAt: Date }>
): ChatSharedLink[] => {
  const seen = new Set<string>();
  const links: ChatSharedLink[] = [];

  for (const message of messages) {
    if (!message.content) continue;
    const matches = message.content.match(URL_IN_TEXT);
    if (!matches) continue;

    for (const raw of matches) {
      const url = raw.replace(/[),.;!?]+$/g, '');
      if (seen.has(url)) continue;
      seen.add(url);

      let host = url;
      try {
        host = new URL(url).hostname.replace(/^www\./, '');
      } catch {
        /* keep raw */
      }

      links.push({
        url,
        host,
        messageId: message._id.toString(),
        createdAt: message.createdAt,
      });
    }
  }

  return links;
};

const assertCreator = (
  userId: string,
  creatorId: { toString(): string }
): void => {
  if (userId !== creatorId.toString()) {
    throw new AppError(
      401,
      'Only group creator is authorised to perform this action'
    );
  }
};

const resolveGroupAvatarUrls = (
  groupAvatar: ChatAvatar | undefined,
  members: PopulatedMember[]
): Array<string | undefined> => {
  if (groupAvatar?.url) return [groupAvatar.url];
  return members
    .slice(0, 3)
    .map((member) => member.avatar?.url)
    .filter(Boolean);
};

const uploadAvatarOrThrow = async (
  avatarFile: UploadableFile
): Promise<ChatAvatar> => {
  const uploaded = await uploadToCloudinary([avatarFile]);
  if (!uploaded.length) {
    throw new AppError(400, 'Failed to upload avatar');
  }
  return {
    publicId: uploaded[0].publicId,
    url: uploaded[0].url,
  };
};

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

  assertCreator(userId, chat.creator);

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

export const getMyChats = async (
  userId: string,
  page: number
): Promise<{ data: ChatListItem[]; totalPages: number }> => {
  const resultPerPage = 20;

  const [chats, totalChats] = await Promise.all([
    chatRepo.findMyChatsPage(
      userId,
      (page - 1) * resultPerPage,
      resultPerPage
    ),
    chatRepo.countForMember(userId),
  ]);

  const chatIds = chats.map((c) => c._id);
  const reads = await chatReadRepo.findByUserAndChats(userId, chatIds);
  const lastReadByChat = new Map(
    reads.map((r) => [r.chat.toString(), r.lastReadAt])
  );
  const unreadByChat = await messageRepo.countUnreadByChats(
    userId,
    chatIds,
    lastReadByChat
  );

  const data = chats.map(({ _id, name, members, groupChat, lastMessage, avatar }) => {
    const typedMembers = members as unknown as PopulatedMember[];
    const otherMembers = typedMembers.filter(
      (member) => member._id.toString() !== userId.toString()
    );
    const chatId = _id.toString();

    return {
      _id,
      groupChat: Boolean(groupChat),
      name: groupChat ? name : otherMembers[0]?.name || 'Unknown',
      avatar: groupChat
        ? resolveGroupAvatarUrls(avatar, typedMembers)
        : [otherMembers[0]?.avatar?.url].filter(Boolean),
      members: otherMembers.map((member) => member._id),
      lastMessage,
      unreadCount: unreadByChat.get(chatId) ?? 0,
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
  _notifications: ChatNotificationInput[]
): Promise<FindChatItem[]> => {
  const chats = await chatRepo.findByIdsForMemberPopulated(userId, userIds);
  const chatIds = chats.map((c) => c._id);
  const reads = await chatReadRepo.findByUserAndChats(userId, chatIds);
  const lastReadByChat = new Map(
    reads.map((r) => [r.chat.toString(), r.lastReadAt])
  );
  const unreadByChat = await messageRepo.countUnreadByChats(
    userId,
    chatIds,
    lastReadByChat
  );

  return chats.map(({ _id, name, members, groupChat, avatar }) => {
    const typedMembers = members as unknown as PopulatedMember[];
    const otherMembers = typedMembers.filter(
      (member) => member._id.toString() !== userId.toString()
    );
    const chatId = _id.toString();

    return {
      _id,
      groupChat,
      name: groupChat ? name : otherMembers[0]?.name || 'Unknown',
      avatar: groupChat
        ? resolveGroupAvatarUrls(avatar, typedMembers)
        : [otherMembers[0]?.avatar?.url || ''],
      notificationCount: unreadByChat.get(chatId) ?? 0,
    };
  });
};

export const markChatRead = async (
  userId: string,
  chatId: string,
  lastReadMessageId?: string
): Promise<MarkChatReadResult> => {
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');

  const isMember = chat.members.some(
    (member) => member.toString() === userId.toString()
  );
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  const latest =
    (lastReadMessageId
      ? null
      : await messageRepo.findLatestInChat(chatId)) ?? null;

  const lastReadAt = new Date();
  const resolvedMessageId =
    lastReadMessageId ?? latest?._id?.toString() ?? undefined;

  await chatReadRepo.upsert({
    chat: chatId,
    user: userId,
    lastReadAt,
    lastReadMessageId: resolvedMessageId,
  });

  await messageRepo.markReadByUser(chatId, userId, lastReadAt);

  const otherMembers = chat.members.filter(
    (member) => member.toString() !== userId.toString()
  );

  return {
    chatId,
    lastReadAt,
    lastReadMessageId: resolvedMessageId,
    notifications: [
      {
        event: CHAT_READ,
        members: otherMembers,
        data: {
          chatId,
          userId,
          lastReadAt: lastReadAt.toISOString(),
          lastReadMessageId: resolvedMessageId,
        },
      },
    ],
  };
};

export const getChatDetails = async (
  userId: string,
  chatId: string,
  shouldPopulate: boolean
): Promise<Record<string, unknown>> => {
  let chat: Record<string, unknown> | null = null;

  if (shouldPopulate) {
    chat = (await chatRepo.findByIdPopulated(chatId)) as Record<
      string,
      unknown
    > | null;
  } else {
    chat = (await chatRepo.findByIdLean(chatId)) as Record<
      string,
      unknown
    > | null;
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
    const storedAvatar =
      chat.avatar &&
      typeof chat.avatar === 'object' &&
      'url' in chat.avatar
        ? (chat.avatar as ChatAvatar)
        : undefined;
    chat.avatar = chat.groupChat
      ? resolveGroupAvatarUrls(storedAvatar, typedMembers)
      : [otherMembers[0]?.avatar?.url || ''];
    if (!chat.groupChat && otherMembers[0]?.bio !== undefined) {
      (chat as { bio?: string }).bio = otherMembers[0].bio;
    }
    chat.members = typedMembers.map(({ _id, avatar, lastSeen, ...rest }) => ({
      ...rest,
      _id,
      avatar: avatar?.url,
      lastSeen: lastSeen
        ? new Date(lastSeen).toISOString()
        : undefined,
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
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');
  assertCreator(userId, chat.creator);

  const existingMembers = new Set(chat.members.map((m) => m.toString()));
  for (const member of members) existingMembers.add(member.toString());

  const nextMembers = Array.from(existingMembers).map(
    (id) => new Types.ObjectId(id)
  );
  const updated = await chatRepo.updateById(chatId, { members: nextMembers });

  const newlyAdded = members.filter((id) => !chat.members.some((m) => m.toString() === id));
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
  assertCreator(userId, chat.creator);

  const nextMembers = chat.members.filter(
    (member) => member.toString() !== memberToBeRemoved.toString()
  );
  await chatRepo.updateById(chatId, { members: nextMembers });

  return {
    notifications: [
      {
        event: REFETCH_CHATS,
        members: [...nextMembers, memberToBeRemoved],
      },
    ],
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
  const patch: {
    members: typeof remainingMembers;
    creator?: (typeof remainingMembers)[number];
  } = { members: remainingMembers };

  if (wasCreator) {
    const randomIndex = Math.floor(Math.random() * remainingMembers.length);
    patch.creator = remainingMembers[randomIndex];
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
  assertCreator(userId, chat.creator);

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

export const getMedia = async (
  userId: string,
  chatId: string
): Promise<ChatSharedContent> => {
  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(400, 'No chat found');

  const isMember = chat.members.some(
    (member) => member.toString() === userId.toString()
  );
  if (!isMember) {
    throw new AppError(401, 'You are not authenticated to access the resource');
  }

  const [messages, textMessages] = await Promise.all([
    messageRepo.findAttachmentsByChat(chatId),
    messageRepo.findTextContentsByChat(chatId),
  ]);

  const attachments = messages.flatMap((msg) => msg.attachments);
  const links = extractUniqueLinks(textMessages);

  return { attachments, links };
};
