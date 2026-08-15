import { compare, hash } from 'bcrypt';
import * as chatRepo from '../repositories/chat.js';
import * as requestRepo from '../repositories/request.js';
import * as userRepo from '../repositories/user.js';
import type {
  PublicUser,
  SearchUserResult,
  UpdateProfileInput,
  UpdateUserPatch,
} from '../types/index.js';
import type { UploadableFile } from '../types/message.js';
import { AppError } from '../utils/AppError.js';
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from '../utils/cloudinary.js';
import { isDisposableEmail } from '../utils/disposableEmail.js';

export const getProfile = async (
  userId: string
): Promise<PublicUser & Record<string, unknown>> => {
  const user = await userRepo.findByIdLean(userId);

  if (!user) {
    throw new AppError(404, 'No user found in the database');
  }

  return {
    ...user,
    _id: user._id as PublicUser['_id'],
    avatar: user.avatar.url,
  };
};

export const updateProfile = async (
  userId: string,
  input: UpdateProfileInput,
  avatarFile?: UploadableFile
): Promise<PublicUser & Record<string, unknown>> => {
  const user = await userRepo.findByIdWithPassword(userId);
  if (!user) {
    throw new AppError(404, 'User not found in the database');
  }

  const patch: UpdateUserPatch = {};

  if (input.oldPassword && input.newPassword) {
    const isMatch = await compare(input.oldPassword, user.password);
    if (!isMatch) {
      throw new AppError(400, 'Old password is incorrect');
    }
    patch.password = await hash(input.newPassword, 10);
  }

  if (input.name) patch.name = input.name;
  if (input.username) patch.username = input.username;
  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.email) {
    const email = input.email.toLowerCase().trim();
    if (isDisposableEmail(email)) {
      throw new AppError(
        400,
        'Temporary or disposable emails are not allowed. Use a real inbox.'
      );
    }
    const existing = await userRepo.findByEmail(email);
    if (existing && existing._id.toString() !== userId) {
      throw new AppError(409, 'Email already in use');
    }
    patch.email = email;
  }

  if (avatarFile) {
    const uploaded = await uploadToCloudinary([avatarFile]);
    if (!uploaded.length) {
      throw new AppError(400, 'Failed to upload avatar');
    }
    patch.avatar = {
      publicId: uploaded[0].publicId,
      url: uploaded[0].url,
    };
  } else if (input.avatar) {
    patch.avatar = input.avatar;
  }

  if (Object.keys(patch).length === 0) {
    throw new AppError(400, 'No profile fields to update');
  }

  await userRepo.updateById(userId, patch);

  if (avatarFile && user.avatar?.publicId) {
    await deleteFromCloudinary([user.avatar.publicId]);
  }

  return getProfile(userId);
};

export const deleteProfile = async (userId: string): Promise<void> => {
  const deleted = await userRepo.deleteById(userId);
  if (!deleted) {
    throw new AppError(404, 'User not found');
  }
};

export const searchUsers = async (
  userId: string,
  name: string
): Promise<SearchUserResult[]> => {
  const myChats = await chatRepo.findDirectChatsForMember(userId);
  const myChatsMembers = myChats.flatMap(({ members }) => members);

  const [allOtherMembers, myRequests] = await Promise.all([
    userRepo.findExcludingIdsByName([...myChatsMembers, userId], name),
    requestRepo.findBySender(userId),
  ]);

  const receiverIds = myRequests.map((request) => request.receiver.toString());

  return allOtherMembers.map(({ _id, name: userName, avatar }) => ({
    _id,
    name: userName,
    avatar: avatar.url,
    isRequested: receiverIds.includes(_id.toString()),
  }));
};
