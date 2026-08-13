import { Chat } from '../models/chat.js';
import type {
  ChatLastMessage,
  ChatLean,
  ChatMembersOnly,
  ChatWithMembersPopulated,
  CreateChatInput,
  DirectChatMembers,
  FriendChatPopulated,
  UpdateChatPatch,
} from '../types/chat.js';

export const create = async (input: CreateChatInput): Promise<ChatLean> => {
  const chat = await Chat.create({
    name: input.name,
    bio: input.bio,
    avatar: input.avatar,
    groupChat: input.groupChat ?? false,
    creator: input.creator,
    members: input.members,
  });

  return chat.toObject() as ChatLean;
};

export const findByIdLean = async (id: string): Promise<ChatLean | null> =>
  Chat.findById(id).lean<ChatLean>();

export const findByIdMembers = async (
  id: string
): Promise<ChatMembersOnly | null> =>
  Chat.findById(id).select('members').lean<ChatMembersOnly>();

export const findDirectChatsForMember = async (
  userId: string
): Promise<DirectChatMembers[]> =>
  Chat.find({ groupChat: false, members: userId })
    .select('members')
    .lean<DirectChatMembers[]>();

export const findMyChatsPage = async (
  userId: string,
  skip: number,
  limit: number
) =>
  Chat.find({ members: userId })
    .populate('members', 'name username email avatar')
    .populate({
      path: 'lastMessage',
      populate: { path: 'sender', select: 'name' },
    })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

export const countForMember = async (userId: string): Promise<number> =>
  Chat.countDocuments({ members: userId });

export const findByIdsForMemberPopulated = async (
  userId: string,
  chatIds: string[]
): Promise<ChatWithMembersPopulated[]> =>
  Chat.find({
    _id: { $in: chatIds },
    members: userId,
  })
    .populate('members', 'name avatar')
    .lean<ChatWithMembersPopulated[]>();

export const findByIdPopulated = async (id: string) =>
  Chat.findById(id)
    .populate('members', 'name avatar bio lastSeen')
    .populate('creator', 'name avatar')
    .lean();

export const updateById = async (
  id: string,
  patch: UpdateChatPatch
): Promise<ChatLean | null> =>
  Chat.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean<ChatLean>();

export const updateLastMessage = async (
  id: string,
  lastMessage: ChatLastMessage
): Promise<void> => {
  await Chat.findByIdAndUpdate(id, { lastMessage });
};

export const clearLastMessage = async (id: string): Promise<void> => {
  await Chat.findByIdAndUpdate(id, { $unset: { lastMessage: 1 } });
};

export const deleteById = async (id: string): Promise<boolean> => {
  const result = await Chat.findByIdAndDelete(id);
  return Boolean(result);
};

export const findDirectChatsPopulated = async (
  userId: string
): Promise<FriendChatPopulated[]> =>
  Chat.find({
    groupChat: false,
    members: userId,
  })
    .populate('members', 'name avatar')
    .lean<FriendChatPopulated[]>();

export const countAll = async (): Promise<number> => Chat.countDocuments();

export const countGroups = async (): Promise<number> =>
  Chat.countDocuments({ groupChat: true });

export const listGroupsForAdmin = async () =>
  Chat.find({ groupChat: true })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('creator', 'name username avatar')
    .populate('members', 'name username avatar')
    .lean();
