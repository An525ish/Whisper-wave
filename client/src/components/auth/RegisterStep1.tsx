import AuthField from '@/components/auth/AuthField';
import AuthSubmit from '@/components/auth/AuthSubmit';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import type { RegisterStep1Form } from '@/types/auth';
import {
  validateConfirmPassword,
  validateEmail,
  validatePassword,
} from '@/utils/authValidators';
import { useForm } from 'react-hook-form';

type RegisterStep1Props = {
  pending: boolean;
  onSubmit: (data: RegisterStep1Form) => Promise<void>;
  onSwitchToLogin: () => void;
  cta: string;
};

const RegisterStep1 = ({ pending, onSubmit, onSwitchToLogin, cta }: RegisterStep1Props) => {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterStep1Form>({
    mode: 'onChange',
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-5 flex flex-1 flex-col gap-3"
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
      <AuthField
        type="password"
        name="password"
        label="Password"
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
        validate={validateConfirmPassword}
        errors={errors}
      />

      <div className="mt-auto flex flex-col gap-3 pt-2">
        <AuthSubmit pending={pending}>{cta}</AuthSubmit>
        <GoogleSignInButton disabled={pending} />
        <p className="text-center text-sm text-body-300">
          Already have an account?{' '}
          <button
            type="button"
            className="font-semibold text-green transition hover:brightness-110 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
            onClick={onSwitchToLogin}
          >
            Sign in
          </button>
        </p>
      </div>
    </form>
  );
};

export default RegisterStep1;
