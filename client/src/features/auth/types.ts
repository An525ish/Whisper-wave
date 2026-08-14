import type { ApiSuccess, User } from '@/shared/types';

export type ProfileResponse = ApiSuccess & { user: User };
export type AuthDataResponse = ApiSuccess & { data: User };

export type LoginForm = {
  username: string;
  password: string;
};

export type ForgotPasswordForm = {
  email: string;
};

export type RegisterForm = {
  name: string;
  username: string;
  password: string;
  confirmPassword: string;
};

export type AdminLoginForm = {
  secretkey: string;
};
