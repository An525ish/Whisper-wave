import { Types } from 'mongoose';
import { CHAT_READ } from '../../constants/socket-events.js';
import * as chatRepo from '../../repositories/chat.js';
import * as chatReadRepo from '../../repositories/chatRead.js';
import * as messageRepo from '../../repositories/message.js';
import type {
  ChatAvatar,
  ChatLastMessage,
  ChatListItem,
  ChatNotificationInput,
  FindChatItem,
  MarkAllChatsReadResult,
  MarkChatReadResult,
  PopulatedMember,
  RealtimeNotify,
} from '../../types/chat.js';
import { AppError } from '../../utils/AppError.js';
import { getGroupRole } from '../../utils/groupRole.js';
import { resolveGroupAvatarUrls, toListLastMessage } from './shared.js';

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
  const lastMessageIds = chats
    .map((c) => c.lastMessage?._id)
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  const [reads, lastMessageReads] = await Promise.all([
    chatReadRepo.findByUserAndChats(userId, chatIds),
    messageRepo.findReadStateByIds(lastMessageIds),
  ]);
  const lastReadByChat = new Map(
    reads.map((r) => [r.chat.toString(), r.lastReadAt])
  );
  const unreadByChat = await messageRepo.countUnreadByChats(
    userId,
    chatIds,
    lastReadByChat
  );
  const readByMap = new Map(
    lastMessageReads.map((msg) => [
      msg._id.toString(),
      (msg.readBy ?? []).map(String),
    ])
  );

  const data = chats.map(({ _id, name, members, groupChat, lastMessage, avatar }) => {
    const typedMembers = members as unknown as PopulatedMember[];
    const otherMembers = typedMembers.filter(
      (member) => member._id.toString() !== userId.toString()
    );
    const chatId = _id.toString();
    const lastMessageId = lastMessage?._id ? String(lastMessage._id) : '';

    return {
      _id,
      groupChat: Boolean(groupChat),
      name: groupChat ? name : otherMembers[0]?.name || 'Unknown',
      avatar: groupChat
        ? resolveGroupAvatarUrls(avatar, typedMembers)
        : [otherMembers[0]?.avatar?.url].filter(Boolean),
      members: otherMembers.map((member) => member._id),
      lastMessage: toListLastMessage(
        lastMessage as ChatLastMessage | undefined,
        userId,
        readByMap.get(lastMessageId) ?? [],
        groupChat
          ? {
              groupChat: true,
              memberIds: typedMembers.map((member) => member._id.toString()),
            }
          : undefined,
      ),
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

  await Promise.all([
    chatReadRepo.upsert({
      chat: chatId,
      user: userId,
      lastReadAt,
      lastReadMessageId: resolvedMessageId,
    }),
    messageRepo.markReadByUser(chatId, userId, lastReadAt),
  ]);

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

export const markAllChatsRead = async (
  userId: string
): Promise<MarkAllChatsReadResult> => {
  const chats = await chatRepo.findMembershipsForMember(userId);
  const lastReadAt = new Date();

  if (chats.length === 0) {
    return { marked: 0, lastReadAt, notifications: [] };
  }

  await chatReadRepo.upsertMany(
    chats.map((chat) => ({
      chat: chat._id,
      user: userId,
      lastReadAt,
      lastReadMessageId: chat.lastMessage?._id
        ? String(chat.lastMessage._id)
        : undefined,
    }))
  );

  const chatIds = chats.map((chat) => chat._id);
  await messageRepo.markReadByUserInChats(userId, chatIds, lastReadAt);

  const notifications: RealtimeNotify[] = chats.map((chat) => ({
    event: CHAT_READ,
    members: chat.members.filter(
      (member) => member.toString() !== userId.toString()
    ),
    data: {
      chatId: chat._id.toString(),
      userId,
      lastReadAt: lastReadAt.toISOString(),
      lastReadMessageId: chat.lastMessage?._id
        ? String(chat.lastMessage._id)
        : undefined,
    },
  }));

  return {
    marked: chats.length,
    lastReadAt,
    notifications,
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

  const leanCreator =
    chat.creator &&
    typeof chat.creator === 'object' &&
    '_id' in (chat.creator as object)
      ? (chat.creator as PopulatedMember)._id
      : chat.creator;
  const memberIds = (
    shouldPopulate
      ? ((chat.members as PopulatedMember[]) ?? []).map((m) => m._id)
      : ((chat.members as Types.ObjectId[]) ?? [])
  ) as Array<{ toString(): string }>;
  const adminIds = ((chat.admins as Types.ObjectId[] | undefined) ??
    []) as Array<{ toString(): string }>;

  chat.myRole = chat.groupChat
    ? getGroupRole(userId, {
        groupChat: true,
        creator: leanCreator as { toString(): string },
        admins: adminIds,
        members: memberIds,
      })
    : null;

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
      isAdmin: (chat.admins as Types.ObjectId[] | undefined)?.some(
        (adminId) => adminId.toString() === _id.toString()
      ) ?? false,
    }));
  }

  return chat;
};
