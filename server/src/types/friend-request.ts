import type { Types } from 'mongoose';

export type IRequestFields = {
  _id: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type FriendSummary = {
  _id: { toString(): string };
  name: string;
  avatar?: string;
};

export type NotificationItem = {
  _id: unknown;
  sender: {
    _id: unknown;
    name: string;
    avatar: string;
  };
};
