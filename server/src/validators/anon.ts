import { z } from 'zod';
import { ANON_MESSAGE_ID_MAX, ANON_MESSAGE_ID_MAX_REACT } from '../constants/anon-events.js';
import { ANON_REACTIONS } from '../constants/anon-reactions.js';

/**
 * Zod schemas for inbound `/anon` socket payloads.
 *
 * Lives in `validators/` (not in the socket layer) so the input contract has one
 * home, matching the HTTP routes and the existing `validators/socket.ts`.
 */
export const anonMessageSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  /**
   * Client-generated idempotency key so an ack can be matched to a bubble.
   * Same charset as the reaction `messageId` (a client may only react to an id it
   * could have sent), and safe to embed in a Redis key.
   */
  id: z
    .string()
    .min(1)
    .max(ANON_MESSAGE_ID_MAX)
    .regex(/^[A-Za-z0-9_-]+$/, 'Message id may only contain letters, digits, - and _')
    .optional(),
});

/**
 * An anonymous identity, as carried by the `anonId` cookie.
 *
 * Always a UUID — the server mints it with `uuid()`. The cookie is client
 * controlled, and the value is embedded in Redis keys, socket room names and the
 * `anonId:reaction` set encoding (which needs it to never contain `:`), so
 * anything else is treated as absent.
 */
export const anonIdSchema = z.string().uuid();

/** Payload-less events still parse an optional empty object. */
export const anonNoPayloadSchema = z.object({}).passthrough().optional();

/**
 * `ANON_REACT` payload.
 *
 * A whitelist, not a string: the client cannot push an arbitrary glyph into
 * someone else's bubble, which in an unmoderated anonymous chat is a hole with
 * nothing behind it. The message id is restricted to characters that are safe to
 * embed in a Redis key, so a crafted id can never walk out of the
 * `match:reactions:` namespace and address another message's set.
 */
export const anonReactionSchema = z.object({
  messageId: z
    .string()
    .min(1)
    .max(ANON_MESSAGE_ID_MAX_REACT)
    .regex(/^[A-Za-z0-9_-]+$/, 'Message id may only contain letters, digits, - and _'),
  reaction: z.enum(ANON_REACTIONS),
});
