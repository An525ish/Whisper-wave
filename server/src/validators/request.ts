import { z } from 'zod';
import { objectIdField } from './fields.js';

export const sendRequestSchema = z.object({
  receiverId: objectIdField,
});

export const handleRequestSchema = z.object({
  requestId: objectIdField,
  accept: z.boolean(),
});

export const searchUserQuerySchema = z.object({
  name: z.string().default(''),
});

export const getMyFriendsQuerySchema = z.object({
  chatId: objectIdField.optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  bio: z.string().max(70).optional(),
});

export type SearchUserQuery = z.infer<typeof searchUserQuerySchema>;
export type GetMyFriendsQuery = z.infer<typeof getMyFriendsQuerySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
