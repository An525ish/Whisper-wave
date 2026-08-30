import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const sendAttachmentsSchema = z.object({
  chatId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid chat id'),
  content: z.string().max(2000).optional(),
  replyToMessageId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid message id')
    .optional(),
  attachments: z
    .array(
      z.object({
        key: z
          .string()
          .min(1)
          .max(512)
          .regex(/^ww\/chats\/[a-f\d]{24}\/[a-f\d]{24}\/.+$/, 'Invalid attachment key'),
        originalName: z.string().min(1).max(255),
        mimeType: z.string().min(1).max(100),
      }),
    )
    .min(1)
    .max(5),
});

export const getMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
});

export const searchMessagesQuerySchema = z.object({
  q: z.string().default(''),
  scope: z.enum(['all', 'text', 'media', 'links']).default('all'),
  from: z.enum(['anyone', 'me', 'others']).default('anyone'),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  senderId: objectId.optional(),
});

export const jumpToDateQuerySchema = z.object({
  dateFrom: z.string().min(1, 'dateFrom is required'),
  dateTo: z.string().optional(),
});

export const listActiveDatesQuerySchema = z.object({
  dateFrom: z.string().min(1, 'dateFrom is required'),
  dateTo: z.string().min(1, 'dateTo is required'),
  tz: z.string().default('UTC'),
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

export const sendGifSchema = z.object({
  chatId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid chat id'),
  gifId: z.string().min(1).max(100),
  gifUrl: z
    .string()
    .url()
    .refine((u) => new URL(u).hostname.endsWith('klipy.com'), {
      message: 'Media URL must be from klipy.com',
    }),
  gifTitle: z.string().max(200).optional(),
  mimeType: z
    .enum(['image/gif', 'image/png', 'image/webp', 'image/jpeg'])
    .optional(),
  kind: z.enum(['gif', 'meme']).optional(),
  replyToMessageId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid message id')
    .optional(),
});

export const forwardMessagesSchema = z.object({
  sourceChatId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid chat id'),
  messageIds: z
    .array(z.string().regex(/^[a-f\d]{24}$/i, 'Invalid message id'))
    .min(1)
    .max(50),
});

export type GetMessagesQuery = z.infer<typeof getMessagesQuerySchema>;
export type SearchMessagesQuery = z.infer<typeof searchMessagesQuerySchema>;
export type JumpToDateQuery = z.infer<typeof jumpToDateQuerySchema>;
export type ListActiveDatesQuery = z.infer<typeof listActiveDatesQuerySchema>;
