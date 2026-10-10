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
    googleId: { type: String, unique: true, sparse: true, select: false },
    password: { type: String, required: true, select: false },
    avatar: { type: avatarSchema, required: true },
    bio: { type: String, maxlength: 70 },
    lastSeen: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    /**
     * Opt-in unfiltered meme feed. Default off, members only, 18+
     * self-declared at enable time — guests and non-opted members always
     * get the blacklist-filtered feed.
     */
    memeUnfiltered: { type: Boolean, default: false },
    memeUnfilteredAt: { type: Date },
    /**
     * Strikes for abuse (room bans, upheld reports). Drive the trust ladder
     * (see `services/user/trust.ts`): only strikes inside 30 days count, so
     * old history forgives itself without a decay job.
     */
    strikes: {
      type: [{ reason: { type: String, required: true }, at: { type: Date, required: true } }],
      default: [],
    },
  },
  { timestamps: true }
);

userSchema.index({ createdAt: -1 });
userSchema.index({ name: 1 });
userSchema.index(
  { name: 'text', username: 'text', email: 'text' },
  {
    weights: { name: 10, username: 5, email: 3 },
    name: 'admin_user_text',
  }
);

export const User =
  (mongoose.models.User as mongoose.Model<IUser> | undefined) ||
  model<IUser>('User', userSchema);
