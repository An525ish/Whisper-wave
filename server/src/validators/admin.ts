import { z } from 'zod';

export const adminLoginSchema = z.object({
  secretKey: z.string().min(1, 'Secret key is required'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const adminIdParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export const adminRemoveMemberParamSchema = z.object({
  id: z.string().min(1, 'Group ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export type AdminIdParam = z.infer<typeof adminIdParamSchema>;
export type AdminRemoveMemberParam = z.infer<typeof adminRemoveMemberParamSchema>;

export const adminActivityEventsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().min(1).optional(),
  type: z.enum(['all', 'messages', 'signups']).default('all'),
});

export type AdminActivityEventsQuery = z.infer<typeof adminActivityEventsQuerySchema>;

export const adminUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().min(1).optional(),
  q: z.string().max(120).optional(),
});

export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;

export const adminGroupsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().min(1).optional(),
  q: z.string().max(120).optional(),
  memberId: z.string().min(1).optional(),
});

export type AdminGroupsQuery = z.infer<typeof adminGroupsQuerySchema>;

export const adminMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().min(1).optional(),
  status: z.enum(['all', 'sent', 'failed']).default('all'),
  q: z.string().max(120).optional(),
  senderId: z.string().min(1).optional(),
});

export type AdminMessagesQuery = z.infer<typeof adminMessagesQuerySchema>;

export const adminAttachmentsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().min(1).optional(),
  q: z.string().max(120).optional(),
  senderId: z.string().min(1).optional(),
  kind: z.enum(['all', 'images', 'videos', 'gifs', 'links', 'docs']).default('all'),
});

export type AdminAttachmentsQuery = z.infer<typeof adminAttachmentsQuerySchema>;

export const adminImpersonationLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  before: z.string().min(1).optional(),
});

export type AdminImpersonationLogsQuery = z.infer<typeof adminImpersonationLogsQuerySchema>;
