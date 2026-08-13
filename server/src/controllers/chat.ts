import type { RequestHandler } from 'express';
import type { Server } from 'socket.io';
import { chatService, flushNotifications } from '../services/index.js';
import type { UploadableFile } from '../types/message.js';
import { AppError } from '../utils/AppError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { param } from '../utils/http.js';

const getIo = (req: { app: { get: (key: string) => unknown } }): Server | undefined =>
  req.app.get('io') as Server | undefined;

export const createGroupChat: RequestHandler = catchAsync(async (req, res) => {
  const { name, members, bio } = req.body as {
    name: string;
    members: string[];
    bio?: string;
  };
  const result = await chatService.createGroupChat(
    req.userId!,
    { name, members, bio },
    req.file as UploadableFile | undefined
  );
  flushNotifications(getIo(req), result.notifications);
  res.status(201).json({
    success: true,
    message: 'Group chat created successfully',
    data: result.chat,
  });
});

export const updateGroupDetails: RequestHandler = catchAsync(async (req, res) => {
  const { name, bio } = req.body as { name?: string; bio?: string };
  const result = await chatService.updateGroupDetails(
    req.userId!,
    param(req.params.chatId),
    { name, bio },
    req.file as UploadableFile | undefined
  );
  flushNotifications(getIo(req), result.notifications);
  res.status(200).json({
    success: true,
    message: 'Group details updated successfully',
  });
});

export const getMyChats: RequestHandler = catchAsync(async (req, res) => {
  const page = Number.parseInt(String(req.query.page ?? '1'), 10) || 1;
  const result = await chatService.getMyChats(req.userId!, page);
  res.status(200).json({
    success: true,
    data: result.data,
    totalPages: result.totalPages,
  });
});

export const findChats: RequestHandler = catchAsync(async (req, res) => {
  const { userIds, notifications } = req.body as {
    userIds: string[];
    notifications: Array<{ chatId: string; count: number }>;
  };
  const data = await chatService.findChats(req.userId!, userIds, notifications);
  res.status(200).json({ success: true, data });
});

export const getChatDetails: RequestHandler = catchAsync(async (req, res) => {
  const chatId = typeof req.query.id === 'string' ? req.query.id : undefined;
  if (!chatId) throw new AppError(400, 'Chat ID is required');

  const data = await chatService.getChatDetails(
    req.userId!,
    chatId,
    req.query.populate === 'true'
  );
  res.status(200).json({ success: true, data });
});

export const addMembers: RequestHandler = catchAsync(async (req, res) => {
  const { members } = req.body as { members: string[] };
  const result = await chatService.addMembers(
    req.userId!,
    param(req.params.chatId),
    members
  );
  flushNotifications(getIo(req), result.notifications);
  res.status(200).json({
    success: true,
    message: 'Members added successfully',
    data: result.chat,
  });
});

export const removeMember: RequestHandler = catchAsync(async (req, res) => {
  const { memberToBeRemoved } = req.body as { memberToBeRemoved: string };
  const result = await chatService.removeMember(
    req.userId!,
    param(req.params.chatId),
    memberToBeRemoved
  );
  flushNotifications(getIo(req), result.notifications);
  res.status(200).json({
    success: true,
    message: 'Members removed successfully',
  });
});

export const leaveGroup: RequestHandler = catchAsync(async (req, res) => {
  const result = await chatService.leaveGroup(
    req.userId!,
    param(req.params.chatId)
  );
  flushNotifications(getIo(req), result.notifications);
  res.status(200).json({ success: true, message: result.message });
});

export const deleteGroup: RequestHandler = catchAsync(async (req, res) => {
  const result = await chatService.deleteGroup(
    req.userId!,
    param(req.params.chatId)
  );
  flushNotifications(getIo(req), result.notifications);
  res.status(200).json({ success: true, message: result.message });
});

export const markChatRead: RequestHandler = catchAsync(async (req, res) => {
  const body = req.body as { lastReadMessageId?: string };
  const result = await chatService.markChatRead(
    req.userId!,
    param(req.params.chatId),
    body.lastReadMessageId
  );
  flushNotifications(getIo(req), result.notifications);
  res.status(200).json({
    success: true,
    data: {
      chatId: result.chatId,
      lastReadAt: result.lastReadAt,
      lastReadMessageId: result.lastReadMessageId,
    },
  });
});

export const markAllChatsRead: RequestHandler = catchAsync(async (req, res) => {
  const result = await chatService.markAllChatsRead(req.userId!);
  flushNotifications(getIo(req), result.notifications);
  res.status(200).json({
    success: true,
    message: 'All chats marked as read',
    data: {
      marked: result.marked,
      lastReadAt: result.lastReadAt,
    },
  });
});

export const getMedia: RequestHandler = catchAsync(async (req, res) => {
  const data = await chatService.getMedia(req.userId!, param(req.params.chatId));
  res.json({ success: true, data });
});
