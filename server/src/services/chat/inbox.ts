import { CHAT_READ } from '../../constants/socket-events.js';
import * as chatRepo from '../../repositories/chat.js';
import * as chatReadRepo from '../../repositories/chatRead.js';
import * as messageRepo from '../../repositories/message.js';
import type {
  ChatDetailsPopulated,
  ChatLastMessage,
  ChatLean,
  FindChatItem,
  FindChatsInput,
  GetChatDetailsInput,
  GetMyChatsInput,
  MarkAllChatsReadInput,
  MarkAllChatsReadResult,
  MarkChatReadInput,
  MarkChatReadResult,
  PaginatedChatsResult,
  RealtimeNotify,
} from '../../types/chat.js';
import { AppError } from '../../utils/AppError.js';
import { getGroupRole } from '../../utils/groupRole.js';
import { resolveGroupAvatarUrls, toListLastMessage } from './shared.js';

export const getMyChats = async (
  input: GetMyChatsInput
): Promise<PaginatedChatsResult> => {
  const { userId, page } = input;
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

  const data = chats.map((chat) => {
    const { _id, name, members, groupChat, lastMessage, avatar, createdAt, clearedFor } = chat;
    const otherMembers = members.filter(
      (member) => member._id.toString() !== userId.toString()
    );
    const chatId = _id.toString();
    const lastMessageId = lastMessage?._id ? String(lastMessage._id) : '';

    // Check if this user cleared the chat and the last message predates the clear
    const clearedEntry = clearedFor?.find((e) => e.user.toString() === userId.toString());
    const lastMsgDate = lastMessage?.createdAt ? new Date(lastMessage.createdAt as unknown as string) : null;
    const isClearedView = clearedEntry && (!lastMsgDate || lastMsgDate <= clearedEntry.at);

    return {
      _id,
      groupChat: Boolean(groupChat),
      name: groupChat ? name : otherMembers[0]?.name || 'Unknown',
      avatar: groupChat
        ? resolveGroupAvatarUrls(avatar, members)
        : [otherMembers[0]?.avatar?.url].filter(Boolean),
      members: otherMembers.map((member) => member._id),
      lastMessage: isClearedView
        ? { content: 'You cleared this chat', createdAt: clearedEntry.at.toISOString(), isRead: true }
        : toListLastMessage(
            lastMessage as ChatLastMessage | undefined,
            userId,
            readByMap.get(lastMessageId) ?? [],
            groupChat
              ? {
                  groupChat: true,
                  memberIds: members.map((member) => member._id.toString()),
                }
              : undefined,
          ),
      unreadCount: unreadByChat.get(chatId) ?? 0,
      createdAt,
    };
  });

  return {
    data,
    totalPages: Math.ceil(totalChats / resultPerPage) || 0,
  };
};

export const findChats = async (
  input: FindChatsInput
): Promise<FindChatItem[]> => {
  const { userId, userIds } = input;
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
    const otherMembers = members.filter(
      (member) => member._id.toString() !== userId.toString()
    );
    const chatId = _id.toString();

    return {
      _id,
      groupChat,
      name: groupChat ? name : otherMembers[0]?.name || 'Unknown',
      avatar: groupChat
        ? resolveGroupAvatarUrls(avatar, members)
        : [otherMembers[0]?.avatar?.url || ''],
      notificationCount: unreadByChat.get(chatId) ?? 0,
    };
  });
};

export const markChatRead = async (
  input: MarkChatReadInput
): Promise<MarkChatReadResult> => {
  const { userId, chatId, lastReadMessageId } = input;
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

  return {
    chatId,
    lastReadAt,
    lastReadMessageId: resolvedMessageId,
    notifications: [
      {
        event: CHAT_READ,
        chatId,
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
  input: MarkAllChatsReadInput
): Promise<MarkAllChatsReadResult> => {
  const { userId } = input;
  const chats = await chatRepo.findUserChatsWithLastMessage(userId);
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
    chatId: chat._id.toString(),
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
  input: GetChatDetailsInput
): Promise<Record<string, unknown>> => {
  const { userId, chatId, populate: shouldPopulate } = input;
  const chat: ChatDetailsPopulated | ChatLean | null = shouldPopulate
    ? await chatRepo.findByIdPopulated(chatId)
    : await chatRepo.findByIdLean(chatId);

  if (!chat) throw new AppError(400, 'No chat found');

  const populated = shouldPopulate && 'creator' in chat && typeof chat.creator === 'object';
  const leanCreator = populated
    ? (chat as ChatDetailsPopulated).creator._id
    : (chat as ChatLean).creator;
  const memberIds = populated
    ? (chat as ChatDetailsPopulated).members.map((m) => m._id)
    : (chat as ChatLean).members;
  const adminIds = chat.admins ?? [];

  const response: Record<string, unknown> = { ...chat };

  response.myRole = chat.groupChat
    ? getGroupRole(userId, {
        groupChat: true,
        creator: leanCreator,
        admins: adminIds,
        members: memberIds,
      })
    : null;

  if (populated) {
    const populatedChat = chat as ChatDetailsPopulated;
    const typedMembers = populatedChat.members;
    const creator = populatedChat.creator;
    const otherMembers = typedMembers.filter(
      (member) => member._id.toString() !== userId.toString()
    );

    if (creator.avatar?.url) {
      response.creator = { ...creator, avatar: creator.avatar.url };
    }

    response.name = chat.groupChat ? chat.name : otherMembers[0]?.name || 'Unknown';
    const storedAvatar =
      chat.avatar &&
      typeof chat.avatar === 'object' &&
      'url' in chat.avatar
        ? chat.avatar
        : undefined;
    response.avatar = chat.groupChat
      ? resolveGroupAvatarUrls(storedAvatar, typedMembers)
      : [otherMembers[0]?.avatar?.url || ''];
    if (!chat.groupChat && otherMembers[0]?.bio !== undefined) {
      response.bio = otherMembers[0].bio;
    }
    response.members = typedMembers.map(({ _id, avatar, lastSeen, ...rest }) => ({
      ...rest,
      _id,
      avatar: avatar?.url,
      lastSeen: lastSeen
        ? new Date(lastSeen).toISOString()
        : undefined,
      isCreator: _id.toString() === creator._id.toString(),
      isAdmin: adminIds.some(
        (adminId) => adminId.toString() === _id.toString()
      ),
    }));
  }

  return response;
};
