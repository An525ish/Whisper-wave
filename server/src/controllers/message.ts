import type { RequestHandler } from 'express';
import type { Server } from 'socket.io';
import { flushNotifications, messageService } from '../services/index.js';
import type { UploadableFile } from '../types/message.js';
import { sendGifSchema } from '../validators/message.js';
import { catchAsync } from '../utils/catchAsync.js';
import { param } from '../utils/http.js';

const getIo = (req: { app: { get: (key: string) => unknown } }): Server | undefined =>
  req.app.get('io') as Server | undefined;

export const getMessageContext: RequestHandler = catchAsync(async (req, res) => {
  const result = await messageService.getMessageContext(
    req.userId!,
    param(req.params.chatId),
    param(req.params.messageId)
  );
  res.status(200).json({ success: true, ...result });
});

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

export const searchMessages: RequestHandler = catchAsync(async (req, res) => {
  const chatId = param(req.params.chatId);
  const q = typeof req.query.q === 'string' ? req.query.q : '';
  const scopeRaw = typeof req.query.scope === 'string' ? req.query.scope : 'all';
  const fromRaw = typeof req.query.from === 'string' ? req.query.from : 'anyone';
  const dateFrom =
    typeof req.query.dateFrom === 'string' ? req.query.dateFrom : undefined;
  const dateTo =
    typeof req.query.dateTo === 'string' ? req.query.dateTo : undefined;
  const senderId =
    typeof req.query.senderId === 'string' ? req.query.senderId : undefined;

  const scope =
    scopeRaw === 'text' || scopeRaw === 'media' || scopeRaw === 'links'
      ? scopeRaw
      : 'all';
  const from =
    fromRaw === 'me' || fromRaw === 'others' ? fromRaw : 'anyone';

  const result = await messageService.searchMessages(req.userId!, chatId, q, {
    scope,
    from,
    senderId,
    dateFrom,
    dateTo,
  });

  res.status(200).json({
    success: true,
    data: result.data,
    total: result.total,
  });
});

export const jumpToDate: RequestHandler = catchAsync(async (req, res) => {
  const chatId = param(req.params.chatId);
  const dateFrom =
    typeof req.query.dateFrom === 'string' ? req.query.dateFrom : '';
  const dateTo =
    typeof req.query.dateTo === 'string' ? req.query.dateTo : undefined;

  if (!dateFrom) {
    res.status(400).json({ success: false, message: 'dateFrom is required' });
    return;
  }

  const data = await messageService.jumpToDate(
    req.userId!,
    chatId,
    dateFrom,
    dateTo
  );

  res.status(200).json({
    success: true,
    data,
  });
});

export const listActiveDates: RequestHandler = catchAsync(async (req, res) => {
  const chatId = param(req.params.chatId);
  const dateFrom =
    typeof req.query.dateFrom === 'string' ? req.query.dateFrom : '';
  const dateTo =
    typeof req.query.dateTo === 'string' ? req.query.dateTo : '';
  const timeZone =
    typeof req.query.tz === 'string' && req.query.tz
      ? req.query.tz
      : 'UTC';

  if (!dateFrom || !dateTo) {
    res.status(400).json({
      success: false,
      message: 'dateFrom and dateTo are required',
    });
    return;
  }

  const result = await messageService.listActiveDates(
    req.userId!,
    chatId,
    dateFrom,
    dateTo,
    timeZone
  );

  res.status(200).json({
    success: true,
    dates: result.dates,
    minYear: result.minYear,
  });
});

export const sendAttachments: RequestHandler = catchAsync(async (req, res) => {
  const { chatId, content, replyToMessageId } = req.body as {
    chatId: string;
    content?: string;
    replyToMessageId?: string;
  };
  const files = (req.files as UploadableFile[] | undefined) ?? [];
  const result = await messageService.sendAttachments(
    req.userId!,
    chatId,
    files,
    content,
    replyToMessageId
  );

  flushNotifications(getIo(req), result.notifications);

  res.status(200).json({
    status: true,
    message: 'Message sent successfully with attachments',
    data: result.data,
  });
});

export const sendGif: RequestHandler = catchAsync(async (req, res) => {
  const { chatId, gifId, gifUrl, gifTitle, replyToMessageId, mimeType, kind } =
    sendGifSchema.parse(req.body);

  const result = await messageService.sendGif(
    req.userId!,
    chatId,
    gifId,
    gifUrl,
    gifTitle ?? (kind === 'meme' ? 'Meme' : 'GIF'),
    replyToMessageId,
    mimeType,
    kind ?? 'gif'
  );

  flushNotifications(getIo(req), result.notifications);

  res.status(200).json({
    success: true,
    message: kind === 'meme' ? 'Meme sent' : 'GIF sent',
    data: result.data,
  });
});

export const editMessage: RequestHandler = catchAsync(async (req, res) => {
  const { content } = req.body as { content: string };
  const result = await messageService.editMessage(
    req.userId!,
    param(req.params.messageId),
    content
  );

  flushNotifications(getIo(req), result.notifications);

  res.status(200).json({
    success: true,
    data: result.data,
  });
});

export const deleteMessage: RequestHandler = catchAsync(async (req, res) => {
  const result = await messageService.deleteMessage(
    req.userId!,
    param(req.params.messageId)
  );

  flushNotifications(getIo(req), result.notifications);

  res.status(200).json({
    success: true,
    messageIds: result.messageIds,
  });
});

export const deleteManyMessages: RequestHandler = catchAsync(async (req, res) => {
  const chatId = param(req.params.chatId);
  const { messageIds } = req.body as { messageIds: string[] };
  const result = await messageService.deleteManyMessages(
    req.userId!,
    chatId,
    messageIds
  );

  flushNotifications(getIo(req), result.notifications);

  res.status(200).json({
    success: true,
    messageIds: result.messageIds,
  });
});

export const clearChatMessages: RequestHandler = catchAsync(async (req, res) => {
  const chatId = param(req.params.chatId);
  const result = await messageService.clearChatMessages(req.userId!, chatId);

  flushNotifications(getIo(req), result.notifications);

  res.status(200).json({
    success: true,
  });
});

export const forwardMessages: RequestHandler = catchAsync(async (req, res) => {
  const targetChatId = param(req.params.targetChatId);
  const { sourceChatId, messageIds } = req.body as {
    sourceChatId: string;
    messageIds: string[];
  };
  const result = await messageService.forwardMessages(
    req.userId!,
    sourceChatId,
    targetChatId,
    messageIds
  );

  flushNotifications(getIo(req), result.notifications);

  res.status(200).json({
    success: true,
  });
});
