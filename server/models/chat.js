import mongoose, { Schema, Types, model } from 'mongoose';

const chatSchema = Schema(
  {
    name: {
      type: String,
      required: true,
    },
    groupChat: {
      type: Boolean,
      default: false,
    },
    creator: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessage: {
      _id: { type: Types.ObjectId, ref: 'Message' },
      content: { type: String },
      sender: { type: Types.ObjectId, ref: 'User' },
      type: {
        type: String,
        enum: ['text', 'image', 'video', 'audio', 'document', 'location'],
      },
      createdAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

export const Chat = mongoose.models.Chat || model('Chat', chatSchema);
