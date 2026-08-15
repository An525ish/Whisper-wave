import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DB_URI: z.string().min(1, 'DB_URI is required'),
  ACCESS_TOKEN_SECRET: z
    .string()
    .min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters'),
  ADMIN_SECRET: z
    .string()
    .default('')
    .refine((value) => value === '' || value.length >= 16, {
      message: 'ADMIN_SECRET must be at least 16 characters when set',
    }),
  ADMIN_TOKEN_SECRET: z
    .string()
    .min(32, 'ADMIN_TOKEN_SECRET must be at least 32 characters')
    .optional(),
  CLIENT_URL: z.string().optional().default(''),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.coerce.number().optional().default(587),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default(''),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isProd = env.NODE_ENV === 'production';

/** JWT secret for admin cookies.
 *  Falls back to ACCESS_TOKEN_SECRET when ADMIN_TOKEN_SECRET is not set,
 *  which means a compromised user secret also compromises admin.
 *  Always set ADMIN_TOKEN_SECRET to a separate value in production. */
export const adminTokenSecret = (() => {
  if (!env.ADMIN_TOKEN_SECRET) {
    if (isProd) {
      console.warn(
        '[SECURITY] ADMIN_TOKEN_SECRET is not set. Falling back to ACCESS_TOKEN_SECRET. ' +
          'Set a separate ADMIN_TOKEN_SECRET in production to isolate admin credentials.',
      );
    }
    return env.ACCESS_TOKEN_SECRET;
  }
  return env.ADMIN_TOKEN_SECRET;
})();
