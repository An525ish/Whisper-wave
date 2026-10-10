import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  createInviteController,
  createRoomController,
  deleteRoomController,
  editRoomController,
  listInvitesController,
  listRoomsController,
  reportRoomController,
  requestListingController,
  revokeInviteController,
  roomInfoController,
} from '../controllers/rooms.js';
import { auth, optionalAuth, reportLimiter, validate } from '../middlewares/index.js';
import {
  hostRoomEditSchema,
  roomCreateSchema,
  roomInfoQuerySchema,
  roomInviteCreateSchema,
  roomSlugInviteParamSchema,
  roomReportSchema,
  roomSlugParamSchema,
} from '../validators/rooms.js';

export const roomsRouter = Router();

/** 5 rooms / hour per IP — creation is rare and template spam is cheap to try. */
const roomCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many rooms created — try again in an hour' },
});

/** Public — the lobby sells nothing that needs an account. */
roomsRouter.get('/', listRoomsController);

/**
 * Members only — creating a public voice requires an account.
 * Unlisted until approved; creation never publishes.
 */
roomsRouter.post('/', auth, roomCreateLimiter, validate(roomCreateSchema), createRoomController);

/**
 * Hosts and mods only — title, description, rules. Official rooms are
 * admin-edited; slug/caps/type/visibility never move here.
 */
roomsRouter.patch(
  '/:slug',
  auth,
  validate(roomSlugParamSchema, 'params'),
  validate(hostRoomEditSchema),
  editRoomController
);

/** Hosts and mods only — ends live instances, removes the template. */
roomsRouter.delete('/:slug', auth, validate(roomSlugParamSchema, 'params'), deleteRoomController);

/** Hosts and mods only — ask for lobby listing (unlisted rooms). */
roomsRouter.post(
  '/:slug/request-listing',
  auth,
  validate(roomSlugParamSchema, 'params'),
  requestListingController
);

/** Public — room info + rules for the pre-join sheet. */
roomsRouter.get(
  '/:slug',
  validate(roomSlugParamSchema, 'params'),
  validate(roomInfoQuerySchema, 'query'),
  roomInfoController
);

/**
 * Invite links for unlisted rooms — hosts and mods only (members). The token
 * is shown once; joins consume uses. Listing/revoking never leaks the token.
 */
roomsRouter.get('/:slug/invites', auth, validate(roomSlugParamSchema, 'params'), listInvitesController);
roomsRouter.post(
  '/:slug/invites',
  auth,
  validate(roomSlugParamSchema, 'params'),
  validate(roomInviteCreateSchema),
  createInviteController
);
roomsRouter.delete(
  '/:slug/invites/:id',
  auth,
  validate(roomSlugInviteParamSchema, 'params'),
  revokeInviteController
);

/**
 * Guest-accessible like every report path (victims must never need an
 * account), behind the shared report limiter.
 */
roomsRouter.post(
  '/:slug/report',
  reportLimiter,
  optionalAuth,
  validate(roomSlugParamSchema, 'params'),
  validate(roomReportSchema),
  reportRoomController
);
