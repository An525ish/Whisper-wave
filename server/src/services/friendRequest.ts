import { Types } from 'mongoose';
import { NEW_REQUEST } from '../constants/socket-events.js';
import * as chatRepo from '../repositories/chat.js';
import * as requestRepo from '../repositories/request.js';
import type {
  FriendSummary,
  NotificationItem,
  RealtimeNotify,
} from '../types/index.js';
import { AppError } from '../utils/AppError.js';

export const sendRequest = async (
  userId: string,
  receiverId: string
): Promise<{ notifications: RealtimeNotify[] }> => {
  if (receiverId === userId) {
    throw new AppError(400, 'Request can not be send to own self');
  }

  const requestExist = await requestRepo.findBetweenUsers(userId, receiverId);

  if (requestExist) {
    throw new AppError(400, 'Request already sent');
  }

  await requestRepo.create(userId, receiverId);

  return {
    notifications: [{ event: NEW_REQUEST, members: [receiverId] }],
  };
};

export const handleRequest = async (
  userId: string,
  requestId: string,
  accept: boolean
): Promise<{ message: string; data?: { senderId: Types.ObjectId } }> => {
  const request = await requestRepo.findByIdWithParties(requestId);

  if (!request) throw new AppError(404, 'No request found');

  if (request.receiver._id.toString() !== userId) {
    throw new AppError(401, 'You are not authorise to handle this request');
  }

  if (!accept) {
    await requestRepo.deleteById(requestId);
    return { message: 'Request rejected successfullly' };
  }

  const senderId = request.sender._id;
  const receiverId = request.receiver._id;

  await Promise.all([
    chatRepo.create({
      name: `${request.sender.name}-${request.receiver.name}`,
      creator: receiverId,
      members: [senderId, new Types.ObjectId(userId)],
    }),
    requestRepo.deleteById(requestId),
  ]);

  return {
    message: 'Request accepted',
    data: { senderId },
  };
};

export const getNotifications = async (
  userId: string
): Promise<NotificationItem[]> => {
  const requests = await requestRepo.findByReceiverWithSender(userId);

  return requests.map(({ _id, sender }) => ({
    _id,
    sender: {
      _id: sender._id,
      name: sender.name,
      avatar: sender.avatar.url,
    },
  }));
};

export const getMyFriends = async (
  userId: string,
  chatId?: string
): Promise<FriendSummary[]> => {
  const chats = await chatRepo.findDirectChatsPopulated(userId);

  const friends = chats.flatMap(({ members }) => {
    const otherMembers = members.filter(
      (member) => member._id.toString() !== userId.toString()
    );

    return otherMembers.map((member) => ({
      _id: member._id,
      name: member.name,
      avatar: member.avatar?.url,
    }));
  });

  if (!chatId) return friends;

  const chat = await chatRepo.findByIdLean(chatId);
  if (!chat) throw new AppError(404, 'Chat not found');

  return friends.filter(
    (friend) =>
      !chat.members.some(
        (member) => member.toString() === friend._id.toString()
      )
  );
};
