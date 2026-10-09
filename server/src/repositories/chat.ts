import type { Types } from 'mongoose';
import { Chat } from '../models/chat.js';
import type {
  ChatLastMessage,
  ChatLean,
  ChatMembersOnly,
  ChatDetailsPopulated,
  JoinedChat,
  UserChatWithLastMessage,
  ChatWithMembersPopulated,
  CreateChatInput,
  DirectChatMembers,
  FriendChatPopulated,
  MyChatPageLean,
  AdminGroupListLean,
  ListGroupsForAdminPageInput,
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

/**
 * Find the existing 1-1 chat between exactly two users, if there is one.
 *
 * Used by the Whisper connect flow so revealing identities never produces a
 * duplicate DM when the two accounts already talk. Matched on exactly two
 * members (a group chat that happens to contain both is not a DM).
 */
export const findDirectChatBetween = async (
  userIdA: string,
  userIdB: string
): Promise<DirectChatMembers | null> => {
  const [a, b] = [userIdA, userIdB].sort();
  const candidates = await Chat.find({ groupChat: false, members: { $all: [a, b] } })
    .select('members')
    .lean<DirectChatMembers[]>();

  return (
    candidates.find(
      (c) =>
        c.members.length === 2 &&
        c.members.map((m) => m.toString()).sort().join('_') === `${a}_${b}`
    ) ?? null
  );
};

export const findMyChatsPage = async (
  userId: string,
  skip: number,
  limit: number,
): Promise<MyChatPageLean[]> =>
  Chat.find({ members: userId, deletedFor: { $nin: [userId] } })
    .populate('members', 'name username email avatar')
    .populate({ path: 'lastMessage.sender', select: 'name' })
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean<MyChatPageLean[]>();

export const countForMember = async (userId: string): Promise<number> =>
  Chat.countDocuments({ members: userId, deletedFor: { $nin: [userId] } });

export const findUserChatsWithLastMessage = async (
  userId: string
): Promise<UserChatWithLastMessage[]> =>
  Chat.find({ members: userId })
    .select('_id members lastMessage')
    .lean<UserChatWithLastMessage[]>();

export const findJoinedChatsForConnect = async (
  userId: string
): Promise<JoinedChat[]> =>
  Chat.find({ members: userId })
    .select('_id members groupChat')
    .lean<JoinedChat[]>();

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

export const findByIdPopulated = async (
  id: string,
): Promise<ChatDetailsPopulated | null> =>
  Chat.findById(id)
    .populate('members', 'name avatar bio lastSeen')
    .populate('creator', 'name avatar')
    .lean<ChatDetailsPopulated>();

export const updateById = async (
  id: string,
  patch: UpdateChatPatch
): Promise<ChatLean | null> =>
  Chat.findByIdAndUpdate(id, { $set: patch }, { returnDocument: 'after' }).lean<ChatLean>();

export const updateLastMessage = async (
  id: string,
  lastMessage: ChatLastMessage
): Promise<void> => {
  // Clear deletedFor so anyone who hid this chat sees it again when a new message arrives
  // $set: deletedFor: [] restores the chat for anyone who deleted it when a new message arrives
  await Chat.findByIdAndUpdate(id, { $set: { lastMessage, deletedFor: [] } });
};

export const clearLastMessage = async (id: string): Promise<void> => {
  await Chat.findByIdAndUpdate(id, { $unset: { lastMessage: 1 } });
};

/** Hide the chat from one member's list only — everyone else still sees it. */
export const addToDeletedFor = async (
  id: string,
  userId: string
): Promise<void> => {
  await Chat.findByIdAndUpdate(id, { $addToSet: { deletedFor: userId } });
};

/**
 * Move one member's `clearedFor` cursor forward.
 *
 * Returns the matched count so the caller can decide whether to insert. The
 * filter has to carry `'clearedFor.user'` as well as `_id`: the positional
 * `$set` below only lands on a chat that already has an entry for THIS user, so
 * a `_id`-only match would report a hit and silently skip the update. Callers
 * must therefore insert when this returns 0, and must not collapse the pair
 * into a single upsert.
 */
export const touchClearedFor = async (
  id: string,
  userId: Types.ObjectId,
  at: Date
): Promise<number> => {
  const result = await Chat.updateOne(
    { _id: id, 'clearedFor.user': userId },
    { $set: { 'clearedFor.$.at': at } }
  );
  return result.matchedCount;
};

/** Fallback for `touchClearedFor`: the member had no `clearedFor` entry yet. */
export const pushClearedFor = async (
  id: string,
  userId: Types.ObjectId,
  at: Date
): Promise<void> => {
  await Chat.updateOne({ _id: id }, { $push: { clearedFor: { user: userId, at } } });
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

export const listGroupsForAdminPage = async (
  input: ListGroupsForAdminPageInput,
): Promise<AdminGroupListLean[]> => {
  const { limit, before, q, memberId } = input;
  const filter: Record<string, unknown> = { ...adminGroupFilter(q, memberId) };
  if (before) filter.createdAt = { $lt: before };

  return Chat.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('creator', 'name username avatar')
    .populate('members', 'name username avatar')
    .lean<AdminGroupListLean[]>();
};

/** @deprecated Use listGroupsForAdminPage */
export const listGroupsForAdmin = async (): Promise<AdminGroupListLean[]> =>
  listGroupsForAdminPage({ limit: 50 });

export const removeMemberFromAllGroups = async (userId: string): Promise<void> => {
  await Chat.updateMany(
    { groupChat: true, members: userId },
    { $pull: { members: userId, admins: userId } },
  );
};
