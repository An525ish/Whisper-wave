import AuthField from '@/components/auth/AuthField';
import AuthSubmit from '@/components/auth/AuthSubmit';
import OtpInput from '@/components/auth/OtpInput';
import UsernameStatusBadge from '@/components/auth/UsernameStatusBadge';
import CheckStrokeIcon from '@/components/ui/icons/CheckStroke';
import MailIcon from '@/components/ui/icons/Mail';
import { useUsernameAvailability } from '@/hooks/auth/useUsernameAvailability';
import type { RegisterStep2Form } from '@/types/auth';
import { validateOtp, validateUsername } from '@/utils/authValidators';
import { Controller, useForm } from 'react-hook-form';

type RegisterStep2Props = {
  email: string;
  otpResent: boolean;
  pending: boolean;
  onSubmit: (data: RegisterStep2Form) => Promise<void>;
  onResend: () => Promise<void>;
  onBack: () => void;
  cta: string;
};

const RegisterStep2 = ({ email, otpResent, pending, onSubmit, onResend, onBack, cta }: RegisterStep2Props) => {
  const { register, handleSubmit, control, watch, formState: { errors }, reset } = useForm<RegisterStep2Form>({
    mode: 'onChange',
    defaultValues: { otp: '', username: '' },
  });

  const usernameValue = watch('username');
  const availabilityStatus = useUsernameAvailability(usernameValue);

  const handleBack = () => {
    reset();
    onBack();
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-5 flex flex-1 flex-col gap-3"
    >
      <div
        className={`auth-code-banner${otpResent ? ' is-resent' : ''}`}
        role={otpResent ? 'status' : undefined}
        aria-live={otpResent ? 'polite' : undefined}
      >
        <span className="auth-code-banner__icon" aria-hidden>
          {otpResent ? <CheckStrokeIcon /> : <MailIcon />}
        </span>
        <div className="auth-code-banner__body">
          <p className="auth-code-banner__eyebrow">
            {otpResent ? 'Fresh code sent to' : 'Code sent to'}
          </p>
          <p className="auth-code-banner__email">{email}</p>
        </div>
        <p className="auth-code-banner__aside">Inbox · 10 min</p>
      </div>

      <Controller
        name="otp"
        control={control}
        rules={{ validate: validateOtp }}
        render={({ field, fieldState }) => (
          <OtpInput
            value={field.value ?? ''}
            onChange={field.onChange}
            onBlur={field.onBlur}
            disabled={pending}
            error={fieldState.error?.message}
          />
        )}
      />
      <div>
        <AuthField
          type="text"
          name="username"
          label="Username"
          placeholder="your_handle"
          autoComplete="username"
          register={register}
          validate={validateUsername}
          errors={errors}
        />
        {!errors.username && <UsernameStatusBadge status={availabilityStatus} />}
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-2 pb-4">
        <AuthSubmit pending={pending} className="mb-2">
          {cta}
        </AuthSubmit>
        <div className="flex items-center justify-between gap-3 text-sm">
          <button
            type="button"
            className="text-body-300 transition hover:text-green focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
            onClick={handleBack}
            disabled={pending}
          >
            ← Back
          </button>
          <button
            type="button"
            className="font-semibold text-green transition hover:brightness-110 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40 disabled:opacity-50"
            onClick={() => void onResend()}
            disabled={pending}
          >
            Resend code
          </button>
        </div>
      </div>
    </form>
  );
};

export default RegisterStep2;
