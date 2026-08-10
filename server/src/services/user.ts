import { compare, hash } from 'bcrypt';
import { Chat } from '../models/chat.js';
import { Request } from '../models/request.js';
import { User } from '../models/user.js';
import type {
  PublicUser,
  SearchUserResult,
  UpdateProfileInput,
  UserAvatar,
} from '../types/index.js';
import { AppError } from '../utils/AppError.js';

export const getProfile = async (userId: string): Promise<PublicUser & Record<string, unknown>> => {
  const user = await User.findById(userId).lean<{
    _id: unknown;
    name: string;
    username: string;
    avatar: { url: string };
    bio?: string;
  }>();

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
  input: UpdateProfileInput
): Promise<void> => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new AppError(404, 'User not found in the database');
  }

  if (input.oldPassword && input.newPassword) {
    const isMatch = await compare(input.oldPassword, user.password);
    if (!isMatch) {
      throw new AppError(400, 'Old password is incorrect');
    }
    user.password = await hash(input.newPassword, 10);
  }

  if (input.name) user.name = input.name;
  if (input.username) user.username = input.username;
  if (input.bio !== undefined) user.bio = input.bio;
  if (input.avatar) user.avatar = input.avatar as UserAvatar;
  void input.email;

  await user.save();
};

export const deleteProfile = async (userId: string): Promise<void> => {
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new AppError(404, 'User not found');
  }
};

export const searchUsers = async (
  userId: string,
  name: string
): Promise<SearchUserResult[]> => {
  const myChats = await Chat.find({ groupChat: false, members: userId });
  const myChatsMembers = myChats.flatMap(({ members }) => members);

  const [allOtherMembers, myRequests] = await Promise.all([
    User.find({
      _id: { $nin: [...myChatsMembers, userId] },
      name: { $regex: name, $options: 'i' },
    }),
    Request.find({ sender: userId }),
  ]);

  const receiverIds = myRequests.map((request) => request.receiver.toString());

  return allOtherMembers.map(({ _id, name: userName, avatar }) => ({
    _id,
    name: userName,
    avatar: avatar.url,
    isRequested: receiverIds.includes(_id.toString()),
  }));
};
