import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(60),
  members: z
    .array(objectId)
    .min(2, 'At least 3 members are required (including you)'),
});

export const updateGroupSchema = z.object({
  name: z.string().trim().min(1, 'Group name is required').max(60),
});

export const addMembersSchema = z.object({
  members: z.array(objectId).min(1, 'Select at least one member to proceed'),
});

export const removeMemberSchema = z.object({
  memberToBeRemoved: objectId,
});

export const findChatsSchema = z.object({
  userIds: z.array(objectId).min(1, 'No userId found'),
  notifications: z
    .array(
      z.object({
        chatId: z.string(),
        count: z.number().int().nonnegative(),
      })
    )
    .default([]),
});

export const chatIdParamSchema = z.object({
  chatId: objectId,
});

export const markChatReadSchema = z.object({
  lastReadMessageId: objectId.optional(),
});
