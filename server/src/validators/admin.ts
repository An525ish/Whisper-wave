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
export const adminReportReviewSchema = z.object({
  reviewed: z.boolean().default(true),
  blockAnonId: z.boolean().default(false),
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
