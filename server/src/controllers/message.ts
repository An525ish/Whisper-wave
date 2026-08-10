import type { RequestHandler } from 'express';
import type { Server } from 'socket.io';
import { flushNotifications, messageService } from '../services/index.js';
import type { UploadableFile } from '../types/message.js';
import { catchAsync } from '../utils/catchAsync.js';
import { param } from '../utils/http.js';

const getIo = (req: { app: { get: (key: string) => unknown } }): Server | undefined =>
  req.app.get('io') as Server | undefined;

export const getMessages: RequestHandler = catchAsync(async (req, res) => {
  const page = Number.parseInt(String(req.query.page ?? '1'), 10) || 1;
  const result = await messageService.getMessages(
    req.userId!,
    param(req.params.chatId),
    page
  );

  res.status(200).json({
    success: true,
    groupChat: result.groupChat,
    data: result.data,
    totalPages: result.totalPages,
  });
});

export const sendAttachments: RequestHandler = catchAsync(async (req, res) => {
  const { chatId, content } = req.body as { chatId: string; content?: string };
  const files = (req.files as UploadableFile[] | undefined) ?? [];
  const result = await messageService.sendAttachments(
    req.userId!,
    chatId,
    files,
    content
  );

  flushNotifications(getIo(req), result.notifications);

  res.status(200).json({
    status: true,
    message: 'Message sent successfully with attachments',
    data: result.data,
  });
});
