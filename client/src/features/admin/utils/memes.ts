import { z } from 'zod';

/** Provider joke ids are non-negative integers (server: `z.number().int().nonnegative()`). */
export const memeBlockSchema = z.object({
  id: z
    .string()
    .trim()
    .regex(/^\d+$/, 'Enter a whole number')
    .refine((v) => Number.isSafeInteger(Number(v)), 'Id is too large'),
});
