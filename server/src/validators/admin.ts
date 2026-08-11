import { z } from 'zod';

export const adminLoginSchema = z.object({
  secretKey: z.string().min(1, 'Secret key is required'),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
