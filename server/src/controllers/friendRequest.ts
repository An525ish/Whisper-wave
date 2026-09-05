import type { RequestHandler } from 'express';
import type { Server } from 'socket.io';
import type { ValidatedRequest } from '../middlewares/validate.js';
import { flushNotifications, friendRequestService, joinUsersToChatRoom, leaveUsersFromChatRoom } from '../services/index.js';
import { REFETCH_CHATS } from '../constants/socket-events.js';
import { catchAsync } from '../utils/catchAsync.js';
import { param } from '../utils/http.js';
import type { GetMyFriendsQuery } from '../validators/request.js';

const getIo = (req: { app: { get: (key: string) => unknown } }): Server | undefined =>
  req.app.get('io') as Server | undefined;

export const sendRequest: RequestHandler = catchAsync(async (req, res) => {
  const { receiverId } = req.body as { receiverId: string };
  const result = await friendRequestService.sendRequest({
    userId: req.userId!,
    receiverId,
  });
  flushNotifications(getIo(req), result.notifications);
  res.status(200).json({
    success: true,
    message: 'Request sent successfully',
  });
});

export const handleRequest: RequestHandler = catchAsync(async (req, res) => {
  const { requestId, accept } = req.body as {
    requestId: string;
    accept: boolean;
  };
  const result = await friendRequestService.handleRequest({
    userId: req.userId!,
    requestId,
    accept,
  });

  if (accept && result.data?.chatId && result.data?.senderId) {
    const io = getIo(req);
    const chatId = result.data.chatId;
    await joinUsersToChatRoom(io!, chatId, [
      req.userId!,
      String(result.data.senderId),
    ]);
    flushNotifications(io, [
      { event: REFETCH_CHATS, chatId, data: { chatId } },
    ]);
  }

  res.status(200).json({
    success: true,
    message: result.message,
    ...(result.data ? { data: result.data } : {}),
  });
});

export const getNotifications: RequestHandler = catchAsync(async (req, res) => {
  const data = await friendRequestService.getNotifications(req.userId!);
  res.status(200).json({
    success: true,
    message: 'Request sent successfully',
    data,
  });
});

export const getMyfriends: RequestHandler = catchAsync(async (req, res) => {
  const { chatId } = (req as ValidatedRequest<GetMyFriendsQuery>).validatedQuery;
  const data = await friendRequestService.getMyFriends({
    userId: req.userId!,
    chatId,
  });
  res.status(200).json({ success: true, data });
});

export const unfriend: RequestHandler = catchAsync(async (req, res) => {
  const chatId = param(req.params.chatId);
  const result = await friendRequestService.unfriend(req.userId!, chatId);
  const io = getIo(req);
  if (io && result.memberIds?.length) {
    flushNotifications(io, result.notifications);
    await leaveUsersFromChatRoom(io, chatId, result.memberIds);
  }
  res.status(200).json({ success: true, message: result.message });
});
