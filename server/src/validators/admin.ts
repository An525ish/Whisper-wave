import { z } from 'zod';
import { objectIdField } from './fields.js';

export const adminLoginSchema = z.object({
  secretKey: z.string().min(1, 'Secret key is required'),
});

export const adminIdParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

/** Moderation queue pagination. */
export const adminReportsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

/** `:id` of a report — must be an ObjectId or the repository would throw a CastError. */
export const adminReportIdParamSchema = z.object({
  id: objectIdField,
});

/** Mark a report reviewed; optionally extend the block between the pair. */
export const adminReportReviewSchema = z
  .object({
    reviewed: z.boolean().default(true),
    blockAnonId: z.boolean().default(false),
    /** What was done (RUNBOOK) — required when resolving. */
    actionNote: z.string().trim().max(500).optional(),
  })
  .refine((b) => !b.reviewed || Boolean(b.actionNote), {
    message: 'Say what was done before marking a report reviewed',
    path: ['actionNote'],
  });

/** One-click offender action on a room report. Review stays a separate step. */
export const adminReportActionSchema = z.object({
  action: z.enum(['ban', 'hide']),
  scope: z.enum(['room', 'global']).default('room'),
  durationMin: z.number().int().min(1).max(60 * 24 * 365).default(1440),
});

export const adminRemoveMemberParamSchema = z.object({
  id: z.string().min(1, 'Group ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export const adminActivityEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().min(1).optional(),
  type: z.enum(['all', 'messages', 'signups']).default('all'),
});

export const adminUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().min(1).optional(),
  q: z.string().max(120).optional(),
  signupMethod: z.enum(['all', 'google', 'email']).default('all'),
});

export const adminGroupsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().min(1).optional(),
  q: z.string().max(120).optional(),
  memberId: z.string().min(1).optional(),
});

export const adminMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().min(1).optional(),
  status: z.enum(['all', 'sent', 'failed']).default('all'),
  q: z.string().max(120).optional(),
  senderId: z.string().min(1).optional(),
});

export const adminAttachmentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().min(1).optional(),
  q: z.string().max(120).optional(),
  senderId: z.string().min(1).optional(),
  kind: z.enum(['all', 'images', 'videos', 'gifs', 'links', 'docs', 'deleted']).default('all'),
});

export const adminImpersonationLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().min(1).optional(),
});

export const adminDeleteAttachmentsSchema = z.object({
  messageIds: z.array(z.string().min(1)).min(1).max(100),
});

export const adminAnonImagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(60).default(30),
  before: z.string().optional(),
});

export const adminDeleteAnonImagesSchema = z.object({
  ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(100),
});
