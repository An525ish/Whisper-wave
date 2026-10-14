import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  deleteReminderController,
  listRemindersController,
  putReminderController,
} from '../controllers/roomReminders.js';
import {
  createInviteController,
  createRoomController,
  deleteRoomController,
  editRoomController,
  listInvitesController,
  listRoomsController,
  myRoomsController,
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
 * Members only — "remind me when it opens". Static path: registered before
 * every `/:slug` route so `reminders` is never read as a slug.
 */
roomsRouter.get('/reminders', auth, listRemindersController);
/** Members only — the caller's own rooms (private rooms are in no lobby). Static: before every `/:slug`. */
roomsRouter.get('/mine', auth, myRoomsController);
roomsRouter.put('/:slug/reminder', auth, validate(roomSlugParamSchema, 'params'), putReminderController);
roomsRouter.delete('/:slug/reminder', auth, validate(roomSlugParamSchema, 'params'), deleteReminderController);

/**
 * Members only — creating a public voice requires an account.
 * Unlisted until approved; creation never publishes.
 */
roomsRouter.post('/', auth, roomCreateLimiter, validate(roomCreateSchema), createRoomController);

/**
 * Host only — title, description, rules. Official rooms are
 * admin-edited; slug/caps/type/visibility never move here.
 */
roomsRouter.patch(
  '/:slug',
  auth,
  validate(roomSlugParamSchema, 'params'),
  validate(hostRoomEditSchema),
  editRoomController
);

/** Host only — ends live instances, removes the template. */
roomsRouter.delete('/:slug', auth, validate(roomSlugParamSchema, 'params'), deleteRoomController);

/** Hosts and mods only — ask for lobby listing (unlisted rooms). */
roomsRouter.post(
  '/:slug/request-listing',
  auth,
  validate(roomSlugParamSchema, 'params'),
  requestListingController
);

/** Public — room info + rules for the pre-join sheet (hosts/mods pass without an invite via optional auth). */
roomsRouter.get(
  '/:slug',
  optionalAuth,
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
