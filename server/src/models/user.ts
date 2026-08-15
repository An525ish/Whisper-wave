import mongoose, { Schema, model, type Document } from 'mongoose';
import type { IUserFields, UserAvatar } from '../types/user.js';

export type IUser = IUserFields & Document;

const avatarSchema = new Schema<UserAvatar>(
  {
    publicId: { type: String, required: true },
    url: { type: String, required: true },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    avatar: { type: avatarSchema, required: true },
    bio: { type: String, maxlength: 70 },
    lastSeen: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

export const User =
  (mongoose.models.User as mongoose.Model<IUser> | undefined) ||
  model<IUser>('User', userSchema);
