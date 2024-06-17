import mongoose, { Schema, Types, model } from 'mongoose';

const rqstSchema = Schema(
  {
    status: {
      type: String,
      default: 'pending',
      enum: ['pending', 'accepted', 'rejected'],
    },
    sender: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    receiver: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamp: true,
  }
);

export const Request = mongoose.models.Request || model('Request', rqstSchema);
