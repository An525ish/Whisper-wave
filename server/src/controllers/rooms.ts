import type { RequestHandler } from 'express';
import type { Server } from 'socket.io';
import { catchAsync } from '../utils/catchAsync.js';
import { parseAnonId, parseGid } from '../socket/identity.js';
import type { ValidatedRequest } from '../middlewares/validate.js';
import { closeRoomInstance } from '../socket/rooms/index.js';
import { findMessageInstance, liveCounts } from '../services/rooms/registry.js';
import { recordRoomReport } from '../services/rooms/autohide.js';
import { fileRoomReport } from '../services/rooms/reports.js';
import { createUserRoom, deleteRoom, editRoomContent, getRoomInfo, listLobbyRooms, requestRoomListing } from '../services/rooms/lobby.js';
import { createInvite, listInvites, revokeInvite } from '../services/rooms/invites.js';
import { listMyRooms, privateRoomCapability } from '../services/rooms/myRooms.js';
import type { ReportReason } from '../types/report.js';

/**
 * GET /api/rooms
 *
 * Public lobby: templates plus live occupancy. Guests and members alike —
 * the lobby sells nothing that needs an account.
 */
export const listRoomsController: RequestHandler = catchAsync(async (_req, res) => {
  const rooms = await listLobbyRooms();
  res.status(200).json({ success: true, data: { rooms } });
});

/**
 * GET /api/rooms/mine — the caller's own rooms (any visibility) plus what the
 * create sheet needs: private-room eligibility and the active/limit count.
 * Titles are the caller's own, so nothing leaks.
 */
export const myRoomsController: RequestHandler = catchAsync(async (req, res) => {
  const [rooms, privateRooms] = await Promise.all([
    listMyRooms(req.userId!),
    privateRoomCapability(req.userId!),
  ]);
  res.status(200).json({ success: true, data: { rooms, privateRooms } });
});

/**
 * GET /api/rooms/:slug
 *
 * Room info + rules for the pre-join sheet. Unlisted rooms 404 like missing
 * ones unless a valid `?invite=` token accompanies the request.
 */
export const roomInfoController: RequestHandler = catchAsync(async (req, res) => {
  const { slug } = req.params as { slug: string };
  const { invite } = (req as ValidatedRequest<{ invite?: string }>).validatedQuery ?? {};
  const room = await getRoomInfo(slug, new Date(), invite, req.userId);
  if (!room) {
    res.status(404).json({ success: false, message: 'Room not found' });
    return;
  }
  res.status(200).json({ success: true, data: { room } });
});

/**
 * GET /api/rooms/:slug/invites — hosts and mods list live invite links.
 */
export const listInvitesController: RequestHandler = catchAsync(async (req, res) => {
  const { slug } = req.params as { slug: string };
  const invites = await listInvites(slug, req.userId!);
  res.status(200).json({
    success: true,
    data: {
      invites: invites.map((i) => ({
        id: String(i._id),
        maxUses: i.maxUses,
        uses: i.uses,
        expiresAt: i.expiresAt,
        revoked: i.revoked,
        createdAt: i.createdAt,
      })),
    },
  });
});

/**
 * POST /api/rooms/:slug/invites — mint one invite link. The token is shown
 * once, hashed at rest, usage-counted per join.
 */
export const createInviteController: RequestHandler = catchAsync(async (req, res) => {
  const { slug } = req.params as { slug: string };
  const { maxUses, ttlDays } = req.body as { maxUses?: number | null; ttlDays?: number };
  const invite = await createInvite({ slug, userId: req.userId!, maxUses, ttlDays });
  res.status(201).json({ success: true, data: { invite } });
});

/** DELETE /api/rooms/:slug/invites/:id — revoke one link. */
export const revokeInviteController: RequestHandler = catchAsync(async (req, res) => {
  const { slug, id } = req.params as { slug: string; id: string };
  await revokeInvite(slug, id, req.userId!);
  res.status(200).json({ success: true, message: 'Invite revoked' });
});

/**
 * POST /api/rooms
 *
 * Members only — creating a public voice requires an account (guests join).
 * Rooms start unlisted unless the creator is trusted. The rules array is the
 * copy the creator accepted; the service stamps accepted-at/by/version.
 */
export const createRoomController: RequestHandler = catchAsync(async (req, res) => {
  const body = req.body as {
    slug: string;
    title: string;
    description: string;
    rules: string[];
    lang?: string;
    visibility?: 'public' | 'private';
  };
  const room = await createUserRoom({
    slug: body.slug,
    title: body.title,
    description: body.description,
    rules: body.rules,
    lang: body.lang ?? 'en',
    visibility: body.visibility ?? 'public',
    userId: req.userId!,
  });
  res.status(201).json({ success: true, data: { room } });
});

/**
 * PATCH /api/rooms/:slug — the host edits title, description, rules.
 * Slug, caps, type and visibility never move via this path (visibility
 * changes are the approval flow, owned by admin).
 */
export const editRoomController: RequestHandler = catchAsync(async (req, res) => {
  const { slug } = req.params as { slug: string };
  const body = req.body as { title: string; description: string; rules: string[] };
  await editRoomContent({
    slug,
    userId: req.userId!,
    title: body.title,
    description: body.description,
    rules: body.rules,
  });
  res.status(200).json({ success: true, message: 'Room updated' });
});

/**
 * DELETE /api/rooms/:slug — the host only (official rooms retire via
 * admin). Ends live instances with a reason, then removes the template.
 * Reports, bans and audit history stay — deletion hides the room, never the
 * record of what happened in it.
 */
export const deleteRoomController: RequestHandler = catchAsync(async (req, res) => {
  const { slug } = req.params as { slug: string };
  const io = req.app.get('io') as Server | undefined;
  await deleteRoom(slug, req.userId!);
  if (io) {
    for (const { instanceId } of liveCounts(slug)) {
      closeRoomInstance(io, instanceId, 'This room was deleted by its host.');
    }
  }
  res.status(200).json({ success: true, message: 'Room deleted' });
});

/**
 * POST /api/rooms/:slug/request-listing — hosts and mods ask for the lobby.
 * Unlisted rooms only. The admin approval queue reads the request flag.
 */
export const requestListingController: RequestHandler = catchAsync(async (req, res) => {
  const { slug } = req.params as { slug: string };
  await requestRoomListing(slug, req.userId!);
  res.status(200).json({ success: true, message: 'Listing requested — the Wave team reviews new rooms' });
});
/**
 * POST /api/rooms/:slug/report
 *
 * Report one room message. The reporter names a message id, never a person;
 * the target is whatever alias holds it. At three distinct reporters the
 * message auto-hides pending review (returned as `hidden: true`).
 */
export const reportRoomController: RequestHandler = catchAsync(async (req, res) => {
  const { slug } = req.params as { slug: string };
  const { messageId, reason, details } = req.body as {
    messageId: string;
    reason: ReportReason;
    details?: string;
  };
  const cookies = req.cookies as Record<string, string> | undefined;

  const instanceId = findMessageInstance(slug, messageId);
  if (!instanceId) {
    res.status(404).json({ success: false, message: 'Message not found' });
    return;
  }

  await fileRoomReport({
    instanceId,
    roomSlug: slug,
    messageId,
    reason,
    details,
    reporterUserId: req.userId ?? null,
    reporterAnonId: parseAnonId(cookies?.['anonId']) ?? null,
    reporterGid: parseGid(cookies?.['gid']) ?? null,
  });

  const reporterKey = req.userId ?? parseGid(cookies?.['gid']) ?? parseAnonId(cookies?.['anonId']) ?? 'unknown';
  const hidden = recordRoomReport(instanceId, messageId, reporterKey);

  res.status(200).json({ success: true, data: { hidden } });
});
