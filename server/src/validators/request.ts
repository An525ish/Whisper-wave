import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const sendRequestSchema = z.object({
  receiverId: objectId,
});

export const handleRequestSchema = z.object({
  requestId: objectId,
  accept: z.boolean(),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    username: z
      .string()
      .trim()
      .min(3)
      .max(30)
      .regex(/^[a-zA-Z0-9_]+$/)
      .optional(),
    email: z.string().email().optional(),
    oldPassword: z.string().min(6).optional(),
    newPassword: z.string().min(6).optional(),
    avatar: z.unknown().optional(),
    bio: z.string().max(200).optional(),
  })
  .refine(
    (data) =>
      !(data.oldPassword || data.newPassword) ||
      (Boolean(data.oldPassword) && Boolean(data.newPassword)),
    { message: 'Both old and new password are required to change password' }
  );
