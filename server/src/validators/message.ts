import { z } from 'zod';

export const sendAttachmentsSchema = z.object({
  chatId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid chat id'),
  content: z.string().max(2000).optional(),
});

export const getMessagesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
});
