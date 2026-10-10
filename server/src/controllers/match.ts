import type { RequestHandler } from 'express';
import { anonCookieOptions } from '../config/cors.js';
import { leaveQueue, saveIdentityCard } from '../services/match/index.js';
import { peekWhisperQuota } from '../services/match/quota.js';
import { catchAsync } from '../utils/catchAsync.js';
import { anonIdSchema } from '../validators/anon.js';
import type { JoinQueueBody } from '../types/input.js';

/**
 * Read the httpOnly anonId cookie if the client already has an identity.
 *
 * The cookie is client-controlled, so anything that is not a UUID is treated as
 * ABSENT (join mints a fresh identity; leave answers 400) rather than trusted.
 */
const anonIdFrom = (req: { cookies?: Record<string, string | undefined> }): string | undefined => {
  const parsed = anonIdSchema.safeParse(req.cookies?.['anonId']);
  return parsed.success ? parsed.data : undefined;
};

/**
 * POST /api/match/join
 *
 * Guest-safe — no auth middleware.
 *
 * Validates the age gate and saves the user's identity card — it does NOT enqueue.
 * ALL queueing and matching happens in one place, the `/anon` socket's connect
 * handler, which the client opens immediately after this call: that is the first
 * point where the account is known, so it can apply the quota and already-matched
 * gates BEFORE enqueueing. Keeping a single entry path also removes the
 * double-match race between HTTP and socket entry points.
 *
 * Response: `{ success: true, data: { status: 'waiting', anonId, isNewIdentity } }`
 * — `status` means "waiting for the socket to connect"; `anonId` is the caller's
 * OWN id.
 */
export const joinQueueController: RequestHandler = catchAsync(async (req, res) => {
  const { displayName, vibeTags, gender } = req.body as JoinQueueBody;

  const { anonId, isNewIdentity } = await saveIdentityCard(
    { displayName, vibeTags, gender },
    anonIdFrom(req)
  );

  // Set (or refresh) the anonId cookie. Always sent, not just for new
  // identities, so the 24 h window is extended on every entry.
  res.cookie('anonId', anonId, anonCookieOptions);

  res.status(200).json({
    success: true,
    data: { status: 'waiting', anonId, isNewIdentity },
  });
});

/**
 * DELETE /api/match/leave
 *
 * Graceful queue exit when the user navigates away before being matched.
 * Does NOT end an active session — use the `ANON_NEXT` socket event for that.
 */
export const leaveQueueController: RequestHandler = catchAsync(async (req, res) => {
  await leaveQueue(anonIdFrom(req));
  res.status(200).json({ success: true, message: 'Left the queue' });
});

/**
 * GET /api/match/quota
 *
 * Auth required. How many whispers this account has left today, so the client
 * can show a real number instead of the static "30/day" copy. Guests are never
 * capped — this endpoint is members-only by design.
 */
export const quotaController: RequestHandler = catchAsync(async (req, res) => {
  const { used, limit } = await peekWhisperQuota(req.userId!);
  res.status(200).json({
    success: true,
    data: { limit, remaining: Math.max(0, limit - used) },
  });
});
