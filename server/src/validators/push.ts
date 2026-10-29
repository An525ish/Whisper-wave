import { z } from 'zod';

export const pushDeviceSchema = z.object({
  token: z.string().min(1).max(4096),
  platform: z.enum(['web']).default('web'),
});

export const pushTokenSchema = z.object({
  token: z.string().min(1).max(4096),
});
