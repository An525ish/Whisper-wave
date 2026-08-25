import { z } from 'zod';
import { emailField, objectIdField, usernameField } from './fields.js';

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

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    username: usernameField.optional(),
    email: emailField.optional(),
    oldPassword: z.string().min(6).optional(),
    newPassword: z.string().min(6).optional(),
    bio: z.string().max(70).optional(),
  })
  .refine(
    (data) =>
      !(data.oldPassword || data.newPassword) ||
      (Boolean(data.oldPassword) && Boolean(data.newPassword)),
    { message: 'Both old and new password are required to change password' }
  );

export type SearchUserQuery = z.infer<typeof searchUserQuerySchema>;
export type GetMyFriendsQuery = z.infer<typeof getMyFriendsQuerySchema>;
