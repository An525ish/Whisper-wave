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

/** Inbound MESSAGE_REACTION socket payload. */
export const socketReactionSchema = z.object({
  messageId: objectIdField,
  chatId: objectIdField,
  // Accepts Unicode emoji sequences (incl. ZWJ + variation selectors); rejects plain ASCII/HTML
  emoji: z.string().min(1).max(20).regex(/^\p{Emoji}/u, 'Must start with an emoji character'),
});

export type SocketNewMessagePayload = z.infer<typeof socketNewMessageSchema>;
export type SocketTypingPayload = z.infer<typeof socketTypingSchema>;
export type SocketReactionPayload = z.infer<typeof socketReactionSchema>;
