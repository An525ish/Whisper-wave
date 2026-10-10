import type { Types } from 'mongoose';

export type UserAvatar = {
  publicId: string;
  url: string;
};

export type IUserFields = {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email?: string;
  password: string;
  googleId?: string;
  avatar: UserAvatar;
  bio?: string;
  lastSeen?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  strikes?: Array<{ reason: string; at: Date }>;
  /** Opt-in unfiltered meme feed (18+ self-declared at enable time). */
  memeUnfiltered?: boolean;
  memeUnfilteredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type LeanUser = {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email?: string;
  avatar: UserAvatar;
  bio?: string;
  lastSeen?: Date;
  strikes?: Array<{ reason: string; at: Date }>;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PublicUser = {
  _id: Types.ObjectId | string;
  name: string;
  username: string;
  email?: string;
  avatar: string;
  bio?: string;
};

export type SearchUserResult = {
  _id: Types.ObjectId;
  name: string;
  avatar: string;
  isRequested: boolean;
};

export type CreateUserInput = {
  name: string;
  username: string;
  email: string;
  password: string;
  googleId?: string;
  avatar: UserAvatar;
  bio?: string;
};

export type UserAuthRecord = {
  _id: Types.ObjectId;
  name: string;
  username: string;
  email?: string;
  password: string;
  avatar: UserAvatar;
  bio?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
};

export type UserSearchRecord = {
  _id: Types.ObjectId;
  name: string;
  avatar: UserAvatar;
};

export type UserNameAvatar = {
  _id: Types.ObjectId;
  name: string;
  avatar: UserAvatar;
};

export type UpdateUserPatch = Partial<{
  name: string;
  username: string;
  email: string;
  password: string;
  googleId: string;
  bio: string;
  avatar: UserAvatar;
  lastSeen: Date;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
  memeUnfiltered: boolean;
  memeUnfilteredAt: Date | null;
}>;

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  message: string;
  user: PublicUser & Record<string, unknown>;
};

export type DayCount = {
  _id: string;
  count: number;
};
