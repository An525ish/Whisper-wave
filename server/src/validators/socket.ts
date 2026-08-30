import { z } from 'zod';
import { objectIdField } from './fields.js';

/** Inbound NEW_MESSAGE socket payload (text send — no REST equivalent). */
export const socketNewMessageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  chatId: objectIdField,
  replyToMessageId: objectIdField.optional(),
});

/** Inbound START_TYPING / STOP_TYPING socket payload. */
export const socketTypingSchema = z.object({
  chatId: objectIdField,
});

export type SocketNewMessagePayload = z.infer<typeof socketNewMessageSchema>;
export type SocketTypingPayload = z.infer<typeof socketTypingSchema>;
