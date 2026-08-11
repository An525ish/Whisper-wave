import type { Types } from 'mongoose';
import { Request } from '../models/request.js';
import type {
  RequestLean,
  RequestWithParties,
  RequestWithSender,
} from '../types/friend-request.js';

export const findBetweenUsers = async (
  userA: string,
  userB: string
): Promise<RequestLean | null> =>
  Request.findOne({
    $or: [
      { sender: userA, receiver: userB },
      { sender: userB, receiver: userA },
    ],
  }).lean<RequestLean>();

export const create = async (
  sender: string,
  receiver: string
): Promise<RequestLean> => {
  const request = await Request.create({ sender, receiver });
  return request.toObject() as RequestLean;
};

export const findByIdWithParties = async (
  id: string
): Promise<RequestWithParties | null> =>
  Request.findById(id)
    .populate<{ sender: { _id: Types.ObjectId; name: string } }>('sender', 'name')
    .populate<{ receiver: { _id: Types.ObjectId; name: string } }>(
      'receiver',
      'name'
    )
    .lean<RequestWithParties>();

export const deleteById = async (id: string): Promise<boolean> => {
  const result = await Request.findByIdAndDelete(id);
  return Boolean(result);
};

export const findByReceiverWithSender = async (
  receiverId: string
): Promise<RequestWithSender[]> =>
  Request.find({ receiver: receiverId })
    .populate('sender', 'name avatar')
    .lean<RequestWithSender[]>();

export const findBySender = async (
  senderId: string
): Promise<RequestLean[]> =>
  Request.find({ sender: senderId }).lean<RequestLean[]>();
