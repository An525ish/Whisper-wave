import type { Types } from 'mongoose';
import { User } from '../models/user.js';
import type { AdminUserListItem } from '../types/admin.js';
import type {
  CreateUserInput,
  DayCount,
  LeanUser,
  UpdateUserPatch,
  UserAuthRecord,
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

export const listForAdmin = async (): Promise<AdminUserListItem[]> =>
  User.find()
    .select('name username avatar createdAt')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean<AdminUserListItem[]>();

export const countCreatedByDay = async (
  start: Date,
  end: Date
): Promise<DayCount[]> =>
  User.aggregate<DayCount>([
    { $match: { createdAt: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);
