import { z } from 'zod';

export const sendAttachmentsSchema = z.object({
  chatId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid chat id'),
  content: z.string().max(2000).optional(),
  replyToMessageId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid message id')
    .optional(),
});

export const getMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
});

export const messageIdParamSchema = z.object({
  messageId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid message id'),
});

export const chatIdOnlyParamSchema = z.object({
  chatId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid chat id'),
});

export const editMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

export const deleteManyMessagesSchema = z.object({
  messageIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid message id'))
    .min(1)
    .max(50),
});

export const forwardMessagesSchema = z.object({
  sourceChatId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid chat id'),
  messageIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid message id'))
    .min(1)
    .max(50),
});
