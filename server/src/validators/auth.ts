import { z } from 'zod';

const emailField = z.string().trim().email('Invalid email address').max(254);

const usernameField = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters')
  .max(30)
  .regex(
    /^[a-zA-Z0-9_]+$/,
    'Username can only contain letters, numbers, and underscores'
  );

const passwordField = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(100)
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

export const signUpStartSchema = z
  .object({
    email: emailField,
    password: passwordField,
    confirmPassword: z.string().min(1, 'Confirm password is required'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const signUpVerifySchema = z.object({
  email: emailField,
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code'),
  username: usernameField,
});

export const signUpResendSchema = z.object({
  email: emailField,
});

export const signUpCompleteSchema = z.object({
  signupToken: z.string().trim().min(1, 'Signup session is required'),
  name: z.string().trim().min(1, 'Name is required').max(50),
  bio: z.string().trim().max(70).optional(),
});

export const signInSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Reset token is required'),
  password: passwordField,
});

export type SignUpStartInput = z.infer<typeof signUpStartSchema>;
export type SignUpVerifyInput = z.infer<typeof signUpVerifySchema>;
export type SignUpResendInput = z.infer<typeof signUpResendSchema>;
export type SignUpCompleteInput = z.infer<typeof signUpCompleteSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
