import { z } from 'zod';

export const adminLoginSchema = z.object({
  secretKey: z.string().min(1, 'Secret key is required'),
});

export const adminIdParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
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
  kind: z.enum(['all', 'images', 'videos', 'gifs', 'links', 'docs']).default('all'),
});

export const adminImpersonationLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().min(1).optional(),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type AdminIdParam = z.infer<typeof adminIdParamSchema>;
export type AdminRemoveMemberParam = z.infer<typeof adminRemoveMemberParamSchema>;
export type AdminActivityEventsQuery = z.infer<typeof adminActivityEventsQuerySchema>;
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;
export type AdminGroupsQuery = z.infer<typeof adminGroupsQuerySchema>;
export type AdminMessagesQuery = z.infer<typeof adminMessagesQuerySchema>;
export type AdminAttachmentsQuery = z.infer<typeof adminAttachmentsQuerySchema>;
export type AdminImpersonationLogsQuery = z.infer<typeof adminImpersonationLogsQuerySchema>;
