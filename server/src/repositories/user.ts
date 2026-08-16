import { Types } from 'mongoose';
import { User } from '../models/user.js';
import type { AdminUserListItem } from '../types/admin.js';
import type {
  CreateUserInput,
  DayCount,
  LeanUser,
  UpdateUserPatch,
  UserAuthRecord,
  UserAvatar,
  UserNameAvatar,
  UserSearchRecord,
} from '../types/user.js';

export const findByIdLean = async (id: string): Promise<LeanUser | null> =>
  User.findById(id).lean<LeanUser>();

export const findByUsername = async (
  username: string
): Promise<LeanUser | null> => User.findOne({ username }).lean<LeanUser>();

export const findByUsernameWithPassword = async (
  username: string
): Promise<UserAuthRecord | null> =>
  User.findOne({ username }).select('+password').lean<UserAuthRecord>();

export const findByEmail = async (
  email: string
): Promise<LeanUser | null> =>
  User.findOne({ email: email.toLowerCase().trim() }).lean<LeanUser>();

export const findByGoogleId = async (
  googleId: string
): Promise<LeanUser | null> =>
  User.findOne({ googleId }).lean<LeanUser>();

export const findByPasswordResetToken = async (
  tokenHash: string
): Promise<UserAuthRecord | null> =>
  User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  })
    .select('+password +passwordResetToken +passwordResetExpires')
    .lean<UserAuthRecord>();

export const findByIdWithPassword = async (
  id: string
): Promise<UserAuthRecord | null> =>
  User.findById(id).select('+password').lean<UserAuthRecord>();

export const findByIdNameAvatar = async (
  id: string
): Promise<UserNameAvatar | null> =>
  User.findById(id, 'name avatar').lean<UserNameAvatar>();

export const updateLastSeen = async (
  id: string,
  lastSeen: Date = new Date()
): Promise<Date> => {
  await User.findByIdAndUpdate(id, { $set: { lastSeen } });
  return lastSeen;
};

export const create = async (
  input: CreateUserInput
): Promise<UserAuthRecord> => {
  const user = await User.create(input);
  return {
    _id: user._id,
    name: user.name,
    username: user.username,
    email: user.email,
    password: user.password,
    avatar: user.avatar,
    bio: user.bio,
  };
};

export const setPasswordReset = async (
  id: string,
  tokenHash: string,
  expiresAt: Date
): Promise<void> => {
  await User.findByIdAndUpdate(id, {
    $set: {
      passwordResetToken: tokenHash,
      passwordResetExpires: expiresAt,
    },
  });
};

export const clearPasswordReset = async (id: string): Promise<void> => {
  await User.findByIdAndUpdate(id, {
    $unset: {
      passwordResetToken: 1,
      passwordResetExpires: 1,
    },
  });
};

export const updateById = async (
  id: string,
  patch: UpdateUserPatch
): Promise<LeanUser | null> =>
  User.findByIdAndUpdate(id, { $set: patch }, { new: true }).lean<LeanUser>();

export const deleteById = async (id: string): Promise<boolean> => {
  const result = await User.findByIdAndDelete(id);
  return Boolean(result);
};

export const findExcludingIdsByName = async (
  excludeIds: Array<string | Types.ObjectId>,
  name: string
): Promise<UserSearchRecord[]> =>
  User.find({
    _id: { $nin: excludeIds },
    name: { $regex: name, $options: 'i' },
  }).lean<UserSearchRecord[]>();

export const countAll = async (): Promise<number> => User.countDocuments();

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const adminUserFilter = (q?: string): Record<string, unknown> => {
  const raw = q?.trim();
  if (!raw) return {};

  const contains = (term: string) => ({
    $regex: escapeRegex(term),
    $options: 'i',
  });

  // @handle — admins often paste usernames with the @ prefix
  if (raw.startsWith('@')) {
    const handle = raw.slice(1).trim();
    if (!handle) return {};
    const match = contains(handle);
    return { $or: [{ username: match }, { name: match }, { email: match }] };
  }

  // email-shaped query (e.g. john@example.com)
  if (raw.includes('@')) {
    return { email: contains(raw) };
  }

  const match = contains(raw);
  return { $or: [{ name: match }, { username: match }, { email: match }] };
};

export const countForAdmin = async (q?: string): Promise<number> =>
  User.countDocuments(adminUserFilter(q));

export const listForAdminPage = async ({
  limit,
  before,
  q,
}: {
  limit: number;
  before?: Date;
  q?: string;
}): Promise<AdminUserListItem[]> => {
  const filter: Record<string, unknown> = { ...adminUserFilter(q) };
  if (before) filter.createdAt = { $lt: before };

  return User.find(filter)
    .select('name username avatar email bio lastSeen createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<AdminUserListItem[]>();
};

export const findByIdForAdmin = async (
  id: string
): Promise<AdminUserListItem | null> => {
  if (!Types.ObjectId.isValid(id)) return null;
  return User.findById(id)
    .select('name username avatar email bio lastSeen createdAt')
    .lean<AdminUserListItem>();
};

/** @deprecated Use listForAdminPage */
export const listForAdmin = async (): Promise<AdminUserListItem[]> =>
  listForAdminPage({ limit: 100 });

export const listRecentSignupsForActivity = async ({
  limit,
  before,
}: {
  limit: number;
  before?: Date;
}): Promise<AdminUserListItem[]> => {
  const filter: Record<string, unknown> = {};
  if (before) filter.createdAt = { $lt: before };

  return User.find(filter)
    .select('name username avatar createdAt')
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean<AdminUserListItem[]>();
};

export const findManyByIdsNameAvatar = async (
  ids: string[]
): Promise<Array<{ _id: Types.ObjectId; name: string; username: string; avatar?: UserAvatar }>> =>
  User.find({ _id: { $in: ids } })
    .select('name username avatar')
    .lean<Array<{ _id: Types.ObjectId; name: string; username: string; avatar?: UserAvatar }>>();

export const countCreatedByDay = async (
  start: Date,
  end: Date
): Promise<DayCount[]> =>
  User.aggregate<DayCount>([
    { $match: { createdAt: { $gte: start, $lte: end } } },
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
