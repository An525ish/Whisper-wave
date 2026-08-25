import { z } from 'zod';

/** Trimmed email, Zod 4 top-level `z.email()` (not deprecated `.string().email()`). */
export const emailField = z
  .string()
  .trim()
  .max(254)
  .pipe(z.email({ error: 'Invalid email address' }));

export const objectIdField = z
  .string()
  .regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const usernameField = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30)
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores'
  );

export const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100)
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export const pageQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
});

export type PageQuery = z.infer<typeof pageQuerySchema>;
