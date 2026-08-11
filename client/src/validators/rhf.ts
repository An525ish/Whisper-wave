import {
  adminSecretSchema,
  emailSchema,
  fullnameSchema,
  passwordSchema,
  usernameSchema,
  zodField,
} from '@/validators/auth';

export const validateUsername = zodField(usernameSchema);
export const validateFullname = zodField(fullnameSchema);
export const validatePassword = zodField(passwordSchema);
export const validateEmail = zodField(emailSchema);
export const validateAdminSecret = zodField(adminSecretSchema);
