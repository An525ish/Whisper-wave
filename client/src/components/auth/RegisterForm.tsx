import AuthField from '@/components/auth/AuthField';
import AuthSubmit from '@/components/auth/AuthSubmit';
import AvatarInput from '@/components/ui/AvatarInput';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import {
  useCompleteSignUpMutation,
  useResendSignUpOtpMutation,
  useStartSignUpMutation,
  useVerifySignUpOtpMutation,
} from '@/hooks/auth';
import type {
  RegisterStep1Form,
  RegisterStep2Form,
  RegisterStep3Form,
} from '@/types/auth';
import {
  validateEmail,
  validateFullname,
  validateOtp,
  validatePassword,
  validateUsername,
} from '@/utils/authValidators';
import {
  clearSignupSession,
  loadSignupSession,
  saveSignupSession,
} from '@/utils/signupSession';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

type RegisterProps = {
  setIsLogin: (value: boolean) => void;
};

type Step = 1 | 2 | 3;

const STEP_COPY: Record<
  Step,
  { title: string; blurb: string; cta: string }
> = {
  1: {
    title: 'Start with your inbox',
    blurb: 'Verify your inbox first — then claim your quiet corner.',
    cta: 'Send code',
  },
  2: {
    title: 'Verify & pick a handle',
    blurb: 'Enter the 6-digit code, then claim your username.',
    cta: 'Verify & continue',
  },
  3: {
    title: 'Show your face',
    blurb: 'A name and photo — then you’re in.',
    cta: 'Create account',
  },
};

const Register = ({ setIsLogin }: RegisterProps) => {
  const saved = loadSignupSession();
  const [step, setStep] = useState<Step>(saved?.step ?? 1);
  const [email, setEmail] = useState(saved?.email ?? '');
  const [signupToken, setSignupToken] = useState(saved?.signupToken ?? '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState('');
  const [resendNote, setResendNote] = useState('');

  // Sync to sessionStorage whenever these values change
  useEffect(() => {
    saveSignupSession({ step, email, signupToken });
  }, [step, email, signupToken]);

  const startSignUp = useStartSignUpMutation();
  const resendOtp = useResendSignUpOtpMutation();
  const verifyOtp = useVerifySignUpOtpMutation();
  const completeSignUp = useCompleteSignUpMutation();

  const step1 = useForm<RegisterStep1Form>({ mode: 'onChange' });
  const step2 = useForm<RegisterStep2Form>({ mode: 'onChange' });
  const step3 = useForm<RegisterStep3Form>({ mode: 'onChange' });

  const pending =
    startSignUp.isPending ||
    verifyOtp.isPending ||
    completeSignUp.isPending ||
    resendOtp.isPending;

  const onStep1 = async (data: RegisterStep1Form) => {
    try {
      const response = await startSignUp.mutateAsync(data);
      setEmail(response.data.email);
      setResendNote('');
      // Step 2’s “Code sent to …” banner is the confirmation
      setStep(2);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong',
      );
    }
  };

  const onStep2 = async (data: RegisterStep2Form) => {
    try {
      const response = await verifyOtp.mutateAsync({
        email,
        otp: data.otp,
        username: data.username,
      });
      setSignupToken(response.data.signupToken);
      setResendNote('');
      // Advancing to step 3 is the confirmation
      setStep(3);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong',
      );
    }
  };

  const onStep3 = async (data: RegisterStep3Form) => {
    if (!avatar) {
      setAvatarError('Please upload an avatar');
      return;
    }
    setAvatarError('');
    try {
      const formData = new FormData();
      formData.append('signupToken', signupToken);
      formData.append('name', data.name);
      formData.append('avatar', avatar);

      await completeSignUp.mutateAsync(formData);
      clearSignupSession();
      // Cookie + store + GuestOnly redirect — no toast
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong',
      );
    }
  };

  const onResend = async () => {
    try {
      const response = await resendOtp.mutateAsync({ email });
      setResendNote(response.message || 'A new code is on its way.');
    } catch (error) {
      setResendNote('');
      toast.error(
        error instanceof Error ? error.message : 'Something went wrong',
      );
    }
  };

  const copy = STEP_COPY[step];

  return (
    <div className="auth-face-body flex h-full flex-col text-left">
      <div className="auth-signup-steps" aria-label={`Step ${step} of 3`}>
        {([1, 2, 3] as const).map((n) => (
          <span
            key={n}
            className={`auth-signup-steps__dot ${
              n === step ? 'is-active' : n < step ? 'is-done' : ''
            }`}
          />
        ))}
        <span className="auth-signup-steps__label">Step {step} of 3</span>
      </div>

      <h2 className="mt-4 font-display text-[1.7rem] leading-none tracking-tight text-white">
        {copy.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-body-300">{copy.blurb}</p>

      {step === 1 ? (
        <form
          onSubmit={step1.handleSubmit(onStep1)}
          className="mt-5 flex flex-1 flex-col gap-3"
        >
          <AuthField
            type="email"
            name="email"
            label="Email"
            placeholder="you@example.com"
            autoComplete="email"
            register={step1.register}
            validate={validateEmail}
            errors={step1.formState.errors}
          />
          <AuthField
            type="password"
            name="password"
            label="Password"
            placeholder="Create a password"
            autoComplete="new-password"
            register={step1.register}
            validate={validatePassword}
            errors={step1.formState.errors}
          />
          <AuthField
            type="password"
            name="confirmPassword"
            label="Confirm"
            placeholder="Repeat password"
            autoComplete="new-password"
            register={step1.register}
            validate={(value: string) =>
              value === step1.watch('password') || 'Passwords do not match'
            }
            errors={step1.formState.errors}
          />

          <div className="mt-auto flex flex-col gap-3 pt-2">
            <AuthSubmit pending={pending}>{copy.cta}</AuthSubmit>
            <GoogleSignInButton disabled={pending} />
            <p className="text-center text-sm text-body-300">
              Already have an account?{' '}
              <button
                type="button"
                className="font-semibold text-green transition hover:brightness-110 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
                onClick={() => setIsLogin(true)}
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      ) : null}

      {step === 2 ? (
        <form
          onSubmit={step2.handleSubmit(onStep2)}
          className="mt-5 flex flex-1 flex-col gap-3"
        >
          <p className="rounded-xl border border-white/10 bg-black-dark/50 px-3 py-2 text-xs text-body-300">
            Code sent to <span className="text-white">{email}</span>
          </p>
          {resendNote ? (
            <p className="text-xs text-green" role="status">
              {resendNote}
            </p>
          ) : null}
          <AuthField
            type="text"
            name="otp"
            label="Verification code"
            placeholder="6-digit code"
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            register={step2.register}
            validate={validateOtp}
            errors={step2.formState.errors}
          />
          <AuthField
            type="text"
            name="username"
            label="Username"
            placeholder="Handle"
            autoComplete="username"
            register={step2.register}
            validate={validateUsername}
            errors={step2.formState.errors}
          />

          <div className="mt-auto flex flex-col gap-3 pt-2">
            <AuthSubmit pending={pending}>{copy.cta}</AuthSubmit>
            <div className="flex items-center justify-between gap-3 text-sm">
              <button
                type="button"
                className="text-body-300 transition hover:text-green focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
                onClick={() => {
                  clearSignupSession();
                  setStep(1);
                  setEmail('');
                  setSignupToken('');
                  setResendNote('');
                  step2.reset();
                }}
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
      ) : null}

      {step === 3 ? (
        <form
          onSubmit={step3.handleSubmit(onStep3)}
          className="mt-5 flex flex-1 flex-col gap-3"
        >
          <AvatarInput
            file={avatar}
            setFile={(file) => {
              setAvatar(file);
              if (file) setAvatarError('');
            }}
          />
          {avatarError ? (
            <p className="text-xs text-red" role="alert">
              {avatarError}
            </p>
          ) : null}
          <AuthField
            type="text"
            name="name"
            label="Full name"
            placeholder="Your name"
            autoComplete="name"
            register={step3.register}
            validate={validateFullname}
            errors={step3.formState.errors}
          />

          <div className="mt-auto flex flex-col gap-3 pt-2">
            <AuthSubmit pending={pending}>{copy.cta}</AuthSubmit>
            <button
              type="button"
              className="text-center text-sm text-body-300 transition hover:text-green focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/40"
              onClick={() => setStep(2)}
              disabled={pending}
            >
              ← Back
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
};

export default Register;
