import type { ApiSuccess, User } from '@/types';

export type ProfileResponse = ApiSuccess & { user: User };
export type AuthDataResponse = ApiSuccess & { data: User };

export type LoginForm = {
  username: string;
  password: string;
};

export type ForgotPasswordForm = {
  email: string;
};

export type ResetPasswordForm = {
  password: string;
  confirmPassword: string;
};

export type RegisterStep1Form = {
  email: string;
  password: string;
  confirmPassword: string;
};

export type RegisterStep2Form = {
  username: string;
  otp: string;
};

export type RegisterStep3Form = {
  name: string;
};

export type AdminLoginForm = {
  secretkey: string;
};
