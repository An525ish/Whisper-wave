/**
 * Auth feature — public API. Only these symbols may be imported by pages or
 * other features (via `@/features/auth`). Internal files use relative imports.
 */
export * as authApi from './api/auth';

export { default as AdminLoginForm } from './components/AdminLoginForm';
export { default as AuthField } from './components/AuthField';
export { default as AuthShell } from './components/AuthShell';
export { default as AuthSubmit } from './components/AuthSubmit';
export { default as ForgotPasswordForm } from './components/ForgotPasswordForm';
export { default as GhostBanner } from './components/GhostBanner';
export { default as LoginForm } from './components/LoginForm';
export { default as RegisterForm } from './components/RegisterForm';

export { useAuthStore } from './store';
export {
  useProfileQuery,
  useResetPasswordMutation,
  useSignOutMutation,
  useUpdateProfileMutation,
} from './hooks';
export { validateConfirmPassword, validatePassword } from './utils/authValidators';

export type { ResetPasswordForm } from './types';
