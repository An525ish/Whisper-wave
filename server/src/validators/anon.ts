import { z } from 'zod';
import { ANON_MESSAGE_ID_MAX, ANON_MESSAGE_ID_MAX_REACT } from '../constants/anon-events.js';
import { isKlipyUrl, isMemegenImageUrl } from './message.js';
import { isReactionEmoji } from '../constants/anon-reactions.js';

/**
 * Zod schemas for inbound `/anon` socket payloads.
 *
 * Lives in `validators/` (not in the socket layer) so the input contract has one
 * home, matching the HTTP routes and the existing `validators/socket.ts`.
 */
export const anonMessageSchema = z.object({
  // May be empty only when a photo is attached (see the refine below).
  content: z.string().trim().max(2000),
  /** R2 key from `/match/image/sign`. Ownership is checked against the session in the service. */
  image: z.object({ key: z.string().min(1).max(300) }).optional(),
  /** A GIF or meme picked from the shared picker; only the known providers' URLs are accepted. */
  gif: z.object({ url: z.url().max(600).refine((u) => isKlipyUrl(u) || isMemegenImageUrl(u), 'Unsupported GIF source') }).optional(),
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
}).refine((m) => m.content.length > 0 || m.image || m.gif, { message: 'Message is empty', path: ['content'] });

/**
 * An anonymous identity, as carried by the `anonId` cookie.
 *
 * Always a UUID — the server mints it with `uuid()`. The cookie is client
 * controlled, and the value is embedded in Redis keys, socket room names and the
 * `anonId:reaction` set encoding (which needs it to never contain `:`), so
 * anything else is treated as absent.
 */
export const anonIdSchema = z.string().uuid();

/**
 * Stable guest identity, as carried by the `gid` cookie (docs/HUB_PLAN.md §6.3).
 *
 * Same UUID shape as `anonId` but a different namespace with a different job:
 * `anonId` rotates every 24 h with the matching session; `gid` lives 30 days
 * for abuse control (bans, rate-limit continuity). Never mix the two — a gid
 * must never be written where an anonId is read, or blocks leak across people.
 */
export const gidSchema = z.string().uuid();

/** Payload-less events still parse an optional empty object. */
export const anonNoPayloadSchema = z.object({}).passthrough().optional();

/** `ANON_READ` payload: the last of the partner's messages this client has seen. */
export const anonReadSchema = z.object({
  messageId: z
    .string()
    .min(1)
    .max(ANON_MESSAGE_ID_MAX_REACT)
    .regex(/^[A-Za-z0-9_-]+$/, 'Message id may only contain letters, digits, - and _'),
});

/**
 * `ANON_REACT` payload.
 *
 * The reaction must be a single emoji glyph (see `isReactionEmoji`), so no text can
 * be pushed into someone else's bubble. The message id is restricted to characters that are safe to
 * embed in a Redis key, so a crafted id can never walk out of the
 * `match:reactions:` namespace and address another message's set.
 */
export const anonReactionSchema = z.object({
  messageId: z
    .string()
    .min(1)
    .max(ANON_MESSAGE_ID_MAX_REACT)
    .regex(/^[A-Za-z0-9_-]+$/, 'Message id may only contain letters, digits, - and _'),
  reaction: z.string().refine(isReactionEmoji, 'Reaction must be a single emoji'),
});
