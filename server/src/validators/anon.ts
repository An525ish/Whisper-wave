import { z } from 'zod';
import { ANON_MESSAGE_ID_MAX } from '../constants/anon-events.js';

/**
 * Zod schemas for inbound `/anon` socket payloads.
 *
 * Lives in `validators/` (not in the socket layer) so the input contract has one
 * home, matching the HTTP routes and the existing `validators/socket.ts`.
 */
export const anonMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  /** Client-generated idempotency key so an ack can be matched to a bubble. */
  id: z.string().min(1).max(ANON_MESSAGE_ID_MAX).optional(),
});

/** Payload-less events still parse an optional empty object. */
export const anonNoPayloadSchema = z.object({}).passthrough().optional();
