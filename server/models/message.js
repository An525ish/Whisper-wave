import mongoose, { Schema, Types, model } from 'mongoose';

const msgSchema = Schema(
  {
    content: String,
    attachment: [
      {
        publicId: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          require: true,
        },
      },
    ],
    sender: {
      type: Types.ObjectId,
      ref: 'User',
    },
    chat: {
      type: Types.ObjectId,
      ref: 'Chat',
    },
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.models.Message || model('Message', msgSchema);
