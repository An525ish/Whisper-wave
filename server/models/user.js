import mongoose, { Schema, model } from 'mongoose';

const userSchema = Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      publicId: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    bio: String,
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.models.User || model('User', userSchema);
