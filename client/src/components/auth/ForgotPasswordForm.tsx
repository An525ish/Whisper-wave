import AuthField from '@/components/auth/AuthField';
import AuthSubmit from '@/components/auth/AuthSubmit';
import { useForgotPasswordMutation } from '@/hooks/auth';
import type { ForgotPasswordForm } from '@/types/auth';
import { validateEmail } from '@/utils/authValidators';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type ForgotPasswordProps = {
  setIsForget: (value: boolean) => void;
};

const ForgotPassword = ({ setIsForget }: ForgotPasswordProps) => {
  const [sent, setSent] = useState(false);
  const forgotPassword = useForgotPasswordMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({ mode: 'onChange' });

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      await forgotPassword.mutateAsync(data);
      setSent(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong',
      );
    }
  };

  return (
    <div className="auth-forgot flex h-full flex-col text-left">
      <div className="auth-forgot__hero" aria-hidden>
        <img
          className="auth-forgot__art"
          src="/images/forget-password.svg"
          alt=""
        />
      </div>

      <h2 className="mt-3 font-display text-[1.7rem] leading-none tracking-tight text-white">
        {sent ? 'Check your inbox' : 'Find your way back'}
      </h2>
      <p className="mt-2 max-w-[18rem] text-sm leading-relaxed text-body-300">
        {sent
          ? 'If that email is on an account, a reset link is on its way. It expires in one hour.'
          : 'Enter the email on your account and we’ll send a quiet reset link.'}
      </p>

      {sent ? (
        <div className="mt-auto flex flex-col gap-3 pt-8">
          <AuthSubmit type="button" onClick={() => setIsForget(false)}>
            Back to sign in
          </AuthSubmit>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-6 flex flex-1 flex-col gap-4"
        >
          <AuthField
            type="email"
            name="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            register={register}
            validate={validateEmail}
            errors={errors}
          />

          <div className="mt-auto flex flex-col gap-3 pt-2">
            <AuthSubmit pending={forgotPassword.isPending}>
              Send reset link
            </AuthSubmit>
            <button
              type="button"
              className="text-center text-sm text-body-300 transition hover:text-green focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
              onClick={() => setIsForget(false)}
            >
              ← Back to sign in
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;
