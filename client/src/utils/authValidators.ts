import { z } from 'zod';

// --- Schemas ---

export const usernameSchema = z
  .string()
  .min(1, 'Username is required')
  .min(3, 'Username must be at least 3 characters')
  .max(30, 'Username must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores');

export const fullnameSchema = z
  .string()
  .min(1, 'Fullname is required')
  .min(3, 'Fullname must be at least 3 characters')
  .regex(/^[a-zA-Z]+( [a-zA-Z]+)*$/, 'Invalid Fullname');

export const passwordSchema = z
  .string()
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const otpSchema = z
  .string()
  .min(1, 'Code is required')
  .regex(/^\d{6}$/, 'Enter the 6-digit code');

export const adminSecretSchema = z
  .string()
  .min(1, 'Secret key is required')
  .min(8, 'Secret key must be at least 8 characters');

export const signInSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Password is required'),
});

export const adminLoginSchema = z.object({
  secretkey: adminSecretSchema,
});

// --- RHF field validators (schema → true | error string) ---

const zodField =
  (schema: z.ZodTypeAny) =>
  (value: unknown): true | string => {
    const result = schema.safeParse(value);
    if (result.success) return true;
    return result.error.issues[0]?.message ?? 'Invalid value';
  };

export const validateUsername = zodField(usernameSchema);
export const validateFullname = zodField(fullnameSchema);
export const validatePassword = zodField(passwordSchema);
export const validateEmail = zodField(emailSchema);
export const validateOtp = zodField(otpSchema);
export const validateAdminSecret = zodField(adminSecretSchema);
