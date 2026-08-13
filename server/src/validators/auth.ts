import { z } from 'zod';

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(50),
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  bio: z.string().trim().max(70).optional(),
});

export const signInSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
