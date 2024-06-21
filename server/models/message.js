import mongoose, { Schema, Types, model } from 'mongoose';

const msgSchema = Schema(
  {
    content: String,
    attachments: [
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
      required: true,
    },
    chat: {
      type: Types.ObjectId,
      ref: 'Chat',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.models.Message || model('Message', msgSchema);
