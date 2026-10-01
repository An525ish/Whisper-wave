import type { RequestHandler } from 'express';
import { anonCookieOptions } from '../config/cors.js';
import { joinQueue, leaveQueue } from '../services/match/index.js';
import { catchAsync } from '../utils/catchAsync.js';
import type { JoinQueueBody } from '../validators/match.js';

/** Read the httpOnly anonId cookie if the client already has an identity. */
const anonIdFrom = (req: { cookies?: Record<string, string | undefined> }): string | undefined =>
  req.cookies?.['anonId'];

/**
 * POST /api/match/join
 *
 * Guest-safe — no auth middleware.
 *
 * Registers the user's identity card + enqueues them, then returns `waiting`.
 * ALL matching happens in one place — the `/anon` socket's connect handler —
 * which the client opens immediately after this call. Keeping a single match
 * path removes the double-match race between HTTP and socket entry points.
 */
export const joinQueueController: RequestHandler = catchAsync(async (req, res) => {
  const { displayName, vibeTags, gender } = req.body as JoinQueueBody;

  const { anonId, isNewIdentity } = await joinQueue(
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
