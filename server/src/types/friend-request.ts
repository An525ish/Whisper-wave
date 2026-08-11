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

export type RequestLean = {
  _id: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected';
  sender: Types.ObjectId;
  receiver: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export type RequestWithParties = {
  _id: Types.ObjectId;
  sender: { _id: Types.ObjectId; name: string };
  receiver: { _id: Types.ObjectId; name: string };
};

export type RequestWithSender = {
  _id: Types.ObjectId;
  sender: { _id: unknown; name: string; avatar: { url: string } };
};
