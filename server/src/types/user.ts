import type { Types } from 'mongoose';

export type UserAvatar = {
  publicId: string;
  url: string;
};

export type IUserFields = {
  _id: Types.ObjectId;
  name: string;
  username: string;
  password: string;
  avatar: UserAvatar;
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type LeanUser = {
  _id: Types.ObjectId;
  name: string;
  username: string;
  avatar: UserAvatar;
  bio?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PublicUser = {
  _id: Types.ObjectId | string;
  name: string;
  username: string;
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
