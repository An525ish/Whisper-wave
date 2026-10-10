import type { RequestHandler } from 'express';
import type { Server } from 'socket.io';
import { catchAsync } from '../../utils/catchAsync.js';
import { closeRoomInstance } from '../../socket/rooms/index.js';
import { setFeatureFlag } from '../../services/hub.js';
import { auditModAction, listAuditTrail } from '../../services/audit.js';
import {
  banIdentity,
  liftRoomBan,
  listRoomBans,
  listRoomsAdmin,
  upsertRoom,
} from '../../services/admin/rooms.js';
import type {
  AdminFeatureFlagBody,
  AdminRoomBanBody,
  AdminRoomUpsertBody,
} from '../../types/adminInput.js';

/** GET /api/admin/rooms — every template with live occupancy. Admin only. */
export const listRoomsAdminController: RequestHandler = catchAsync(async (_req, res) => {
  const rooms = await listRoomsAdmin();
  res.status(200).json({ success: true, data: { rooms } });
});

/** PUT /api/admin/rooms — create or edit a template. Slug is the identity. */
export const upsertRoomController: RequestHandler = catchAsync(async (req, res) => {
  const body = req.body as AdminRoomUpsertBody;
  const room = await upsertRoom(body);
  auditModAction({
    actorKind: 'admin',
    actorLabel: 'admin',
    action: 'room-edit',
    target: body.slug,
    roomSlug: body.slug,
    detail: `visibility=${body.visibility} official=${body.official}`,
  });
  res.status(200).json({ success: true, data: { room } });
});

/**
 * POST /api/admin/rooms/instances/:id/close — evict a live instance now.
 * Sockets stay connected (they may join elsewhere); only this room ends.
 */
export const closeInstanceController: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params as { id: string };
  const { reason } = req.body as { reason?: string };
  const io = req.app.get('io') as Server | undefined;
  if (!io) {
    res.status(503).json({ success: false, message: 'Realtime layer unavailable' });
    return;
  }
  const closed = closeRoomInstance(io, id, reason || 'Closed by the Wave team.');
  if (!closed) {
    res.status(404).json({ success: false, message: 'Instance not found' });
    return;
  }
  auditModAction({ actorKind: 'admin', actorLabel: 'admin', roomSlug: null, instanceId: id, action: 'close', detail: reason || null });
  res.status(200).json({ success: true, message: 'Instance closed' });
});

/** GET /api/admin/room-bans — newest first. Admin only. */
export const listRoomBansController: RequestHandler = catchAsync(async (_req, res) => {
  const bans = await listRoomBans();
  res.status(200).json({ success: true, data: { bans } });
});

/** POST /api/admin/room-bans — ban an identity from one room or all. Admin only. */
export const banIdentityController: RequestHandler = catchAsync(async (req, res) => {
  const body = req.body as AdminRoomBanBody;
  const ban = await banIdentity(body);
  auditModAction({
    actorKind: 'admin',
    actorLabel: 'admin',
    action: 'ban',
    target: body.gid ?? body.userId ?? null,
    roomSlug: body.roomSlug,
    detail: `${body.minutes} min — ${body.reason}`,
  });
  res.status(201).json({ success: true, data: { ban } });
});

/** DELETE /api/admin/room-bans/:id — lift a ban. Admin only. */
export const liftBanController: RequestHandler = catchAsync(async (req, res) => {
  const { id } = req.params as { id: string };
  await liftRoomBan(id);
  auditModAction({ actorKind: 'admin', actorLabel: 'admin', action: 'unban', target: id });
  res.status(200).json({ success: true, message: 'Ban lifted' });
});

/**
 * POST /api/admin/features — the incident switch. One surface off or back on
 * immediately, no deploy. A restart resets to env: flags stay the durable
 * state, this is the panic button, and it is logged as such.
 */
export const setFeatureController: RequestHandler = catchAsync(async (req, res) => {
  const { feature, enabled } = req.body as AdminFeatureFlagBody;
  const features = setFeatureFlag(feature, enabled);
  auditModAction({
    actorKind: 'admin',
    actorLabel: 'admin',
    action: 'feature',
    detail: `${feature} → ${enabled ? 'on' : 'off'}`,
  });
  res.status(200).json({ success: true, data: { features } });
});

/** GET /api/admin/mod-audit — newest first, bounded. Admin only. */
export const listAuditController: RequestHandler = catchAsync(async (_req, res) => {
  const entries = await listAuditTrail();
  res.status(200).json({ success: true, data: { entries } });
});
