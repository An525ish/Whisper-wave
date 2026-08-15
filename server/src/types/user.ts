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
  avatar: UserAvatar;
  bio?: string;
  lastSeen?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
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

export type UpdateProfileInput = {
  name?: string;
  username?: string;
  email?: string;
  oldPassword?: string;
  newPassword?: string;
  avatar?: UserAvatar;
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
  bio: string;
  avatar: UserAvatar;
  lastSeen: Date;
  passwordResetToken: string | null;
  passwordResetExpires: Date | null;
}>;

export type AuthResult = {
  token: string;
  message: string;
  user: PublicUser & Record<string, unknown>;
};

export type DayCount = {
  _id: string;
  count: number;
};
