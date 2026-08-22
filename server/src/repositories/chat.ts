import { Chat } from '../models/chat.js';
import type {
  ChatLastMessage,
  ChatLean,
  ChatMembersOnly,
  ChatMembership,
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
    admins: input.admins ?? [],
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
    .populate({ path: 'lastMessage.sender', select: 'name' })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

export const countForMember = async (userId: string): Promise<number> =>
  Chat.countDocuments({ members: userId });

export const findMembershipsForMember = async (
  userId: string
): Promise<ChatMembership[]> =>
  Chat.find({ members: userId })
    .select('_id members lastMessage')
    .lean<ChatMembership[]>();

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
  Chat.findByIdAndUpdate(id, { $set: patch }, { returnDocument: 'after' }).lean<ChatLean>();

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

export const countGroupsCreatedByDay = async (
  start: Date,
  end: Date
): Promise<{ _id: string; count: number }[]> =>
  Chat.aggregate<{ _id: string; count: number }>([
    { $match: { groupChat: true, createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: 'UTC',
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const adminGroupFilter = (q?: string, memberId?: string): Record<string, unknown> => {
  const filter: Record<string, unknown> = { groupChat: true };
  const term = q?.trim();
  if (term) filter.name = { $regex: escapeRegex(term), $options: 'i' };
  if (memberId) filter.members = memberId;
  return filter;
};

export const countGroupsForAdmin = async (q?: string, memberId?: string): Promise<number> =>
  Chat.countDocuments(adminGroupFilter(q, memberId));

export const listGroupsForAdminPage = async ({
  limit,
  before,
  q,
  memberId,
}: {
  limit: number;
  before?: Date;
  q?: string;
  memberId?: string;
}) => {
  const filter: Record<string, unknown> = { ...adminGroupFilter(q, memberId) };
  if (before) filter.createdAt = { $lt: before };

  return Chat.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('creator', 'name username avatar')
    .populate('members', 'name username avatar')
    .lean();
};

/** @deprecated Use listGroupsForAdminPage */
export const listGroupsForAdmin = async () =>
  listGroupsForAdminPage({ limit: 50 });

export const removeMemberFromAllGroups = async (userId: string): Promise<void> => {
  await Chat.updateMany(
    { groupChat: true, members: userId },
    { $pull: { members: userId, admins: userId } },
  );
};
