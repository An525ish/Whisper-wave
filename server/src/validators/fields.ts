import { z } from 'zod';

/** Trimmed email, Zod 4 top-level `z.email()` (not deprecated `.string().email()`). */
export const emailField = z
  .string()
  .trim()
  .max(254)
  .pipe(z.email({ error: 'Invalid email address' }));
