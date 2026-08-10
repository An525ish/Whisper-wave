import { compare, hash } from 'bcrypt';
import type { Types } from 'mongoose';
import { User } from '../models/user.js';
import type { PublicUser } from '../types/user.js';
import type { UploadableFile } from '../types/message.js';
import { AppError } from '../utils/AppError.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { generateToken } from '../utils/token.js';
import type { SignInInput, SignUpInput } from '../validators/auth.js';

export type AuthResult = {
  token: string;
  message: string;
  user: PublicUser & Record<string, unknown>;
};

const toPublicUser = (user: {
    _id: Types.ObjectId;
    name: string;
    username: string;
    avatar: { url: string };
    bio?: string;
    toObject?: () => Record<string, unknown>;
  }): PublicUser & Record<string, unknown> => {
  const base = user.toObject ? user.toObject() : { ...user };
  delete (base as { password?: string }).password;

  return {
    ...base,
    _id: user._id,
    name: user.name,
    username: user.username,
    avatar: user.avatar.url,
    bio: user.bio,
  };
};

export const signUp = async (
  input: SignUpInput,
  avatarFile?: UploadableFile
): Promise<AuthResult> => {
  if (!avatarFile) {
    throw new AppError(400, 'Please upload an avatar');
  }

  const userExist = await User.findOne({ username: input.username });
  if (userExist) {
    throw new AppError(409, 'User already exist');
  }

  const hashedPassword = await hash(input.password, 10);
  const uploadedAvatar = await uploadToCloudinary([avatarFile]);

  if (!uploadedAvatar.length) {
    throw new AppError(400, 'Failed to upload avatar');
  }

  const user = await User.create({
    name: input.name,
    username: input.username,
    password: hashedPassword,
    avatar: {
      publicId: uploadedAvatar[0].publicId,
      url: uploadedAvatar[0].url,
    },
    bio: input.bio,
  });

  return {
    token: generateToken(user._id.toString()),
    message: 'Registered Successfullly',
    user: toPublicUser(user),
  };
};

export const signIn = async (input: SignInInput): Promise<AuthResult> => {
  const user = await User.findOne({ username: input.username }).select('+password');
  if (!user) {
    throw new AppError(401, 'Invalid Credentials');
  }

  const isMatch = await compare(input.password, user.password);
  if (!isMatch) {
    throw new AppError(401, 'Invalid Credentials');
  }

  return {
    token: generateToken(user._id.toString()),
    message: `Welcome back, ${user.name}`,
    user: toPublicUser(user),
  };
};
