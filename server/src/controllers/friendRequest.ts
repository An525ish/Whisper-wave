import type { RequestHandler } from 'express';
import type { Server } from 'socket.io';
import { flushNotifications, friendRequestService } from '../services/index.js';
import { catchAsync } from '../utils/catchAsync.js';

const getIo = (req: { app: { get: (key: string) => unknown } }): Server | undefined =>
  req.app.get('io') as Server | undefined;

export const sendRequest: RequestHandler = catchAsync(async (req, res) => {
  const { receiverId } = req.body as { receiverId: string };
  const result = await friendRequestService.sendRequest(req.userId!, receiverId);
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
  const result = await friendRequestService.handleRequest(
    req.userId!,
    requestId,
    accept
  );

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
  const chatId =
    typeof req.query.chatId === 'string' ? req.query.chatId : undefined;
  const data = await friendRequestService.getMyFriends(req.userId!, chatId);
  res.status(200).json({ success: true, data });
});
