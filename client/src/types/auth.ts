import type { ApiSuccess, User } from '@/types';

export type ProfileResponse = ApiSuccess & { user: User; isImpersonated?: boolean };
export type AuthDataResponse = ApiSuccess & { data: User };

// --- Form shapes ---

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

// Used when going back from step 3 to edit the username without re-verifying OTP
export type RegisterEditUsernameForm = {
  username: string;
};

export type RegisterStep3Form = {
  name: string;
};

export type AdminLoginForm = {
  secretkey: string;
};

// --- API request body shapes ---

export type StartSignUpBody = Pick<RegisterStep1Form, 'email' | 'password' | 'confirmPassword'>;

export type ResendOtpBody = { email: string };

export type VerifySignUpBody = {
  email: string;
  otp: string;
  username: string;
};

export type UpdateSignupUsernameBody = {
  signupToken: string;
  username: string;
};

export type GoogleSignInBody = {
  credential?: string;
  accessToken?: string;
};

// --- API response data shapes ---

export type StartSignUpResponse = ApiSuccess & { data: { email: string } };
export type VerifySignUpResponse = ApiSuccess & { data: { signupToken: string } };
