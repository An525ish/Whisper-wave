import AuthField from '@/components/auth/AuthField';
import AuthShell from '@/components/auth/AuthShell';
import AuthSubmit from '@/components/auth/AuthSubmit';
import { useResetPasswordMutation } from '@/hooks/auth';
import type { ResetPasswordForm } from '@/types/auth';
import { validatePassword } from '@/utils/authValidators';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const PRODUCT_VOICE =
  'Anonymous when you want. Connected when it clicks.';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token')?.trim() ?? '';
  const navigate = useNavigate();
  const resetPassword = useResetPasswordMutation();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordForm>({ mode: 'onChange' });

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token) {
      toast.error('Reset link is missing or incomplete');
      return;
    }

    try {
      const response = await resetPassword.mutateAsync({
        token,
        password: data.password,
      });
      toast.success(response.message || 'Password updated');
      navigate('/auth', { replace: true });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong',
      );
    }
  };

  return (
    <AuthShell
      headline="Choose a new password."
      subcopy={PRODUCT_VOICE}
      modeHint="Reset password"
      mode="forgot"
    >
      <div className="auth-forgot flex h-full min-h-0 flex-col text-left">
        <div className="auth-forgot__hero" aria-hidden>
          <img
            className="auth-forgot__art"
            src="/images/forget-password.svg"
            alt=""
          />
        </div>

        <h2 className="mt-3 font-display text-[1.7rem] leading-none tracking-tight text-white">
          {token ? 'Lock it in' : 'Link incomplete'}
        </h2>
        <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-body-300">
          {token
            ? 'Pick something strong. You’ll slip back into the quiet in a moment.'
            : 'This reset link is missing its token. Request a fresh one from sign in.'}
        </p>

        {token ? (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="mt-6 flex flex-1 flex-col gap-4"
          >
            <AuthField
              type="password"
              name="password"
              label="New password"
              placeholder="Create a password"
              autoComplete="new-password"
              register={register}
              validate={validatePassword}
              errors={errors}
            />
            <AuthField
              type="password"
              name="confirmPassword"
              label="Confirm"
              placeholder="Repeat password"
              autoComplete="new-password"
              register={register}
              validate={(value: string) =>
                value === watch('password') || 'Passwords do not match'
              }
              errors={errors}
            />

            <div className="auth-forgot__note" role="note">
              After you update, you’ll land on sign in with the new password.
            </div>

            <div className="mt-auto flex flex-col gap-3 pt-2">
              <AuthSubmit pending={resetPassword.isPending}>
                Update password
              </AuthSubmit>
              <Link
                to="/auth"
                className="text-center text-sm text-body-300 transition hover:text-green focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
              >
                ← Back to sign in
              </Link>
            </div>
          </form>
        ) : (
          <div className="mt-auto flex flex-1 flex-col justify-end gap-3 pt-8">
            <div className="auth-forgot__note" role="note">
              Open the link from your email, or start recovery again from the
              sign-in screen.
            </div>
            <AuthSubmit type="button" onClick={() => navigate('/auth')}>
              Back to sign in
            </AuthSubmit>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
