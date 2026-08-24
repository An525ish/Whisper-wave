import RegisterEditUsername from '@/components/auth/RegisterEditUsername';
import RegisterStep1 from '@/components/auth/RegisterStep1';
import RegisterStep2 from '@/components/auth/RegisterStep2';
import RegisterStep3 from '@/components/auth/RegisterStep3';
import {
  useCompleteSignUpMutation,
  useResendSignUpOtpMutation,
  useStartSignUpMutation,
  useUpdateSignupUsernameMutation,
  useVerifySignUpOtpMutation,
} from '@/hooks/auth';
import type {
  RegisterEditUsernameForm,
  RegisterStep1Form,
  RegisterStep2Form,
  RegisterStep3Form,
} from '@/types/auth';
import { toErrorMessage } from '@/utils/helpers';
import {
  clearSignupSession,
  loadSignupSession,
  saveSignupSession,
} from '@/utils/signupSession';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type RegisterFormProps = {
  setIsLogin: (value: boolean) => void;
};

/**
 * Wizard steps:
 *   1            — email + password
 *   2            — OTP + pick username
 *   'edit-username' — change username without re-verifying (requires signupToken)
 *   3            — name + optional avatar → create account
 *
 * Navigation rules:
 *   Step 1 → 2   normal forward
 *   Step 2 ← 1   "Back" before any OTP is verified → clear session, restart
 *   Step 2 → 3   OTP verified, signupToken issued
 *   Step 3 → 'edit-username'  already verified; change username via PATCH, no OTP
 *   'edit-username' → 3   save username, go forward
 *   'edit-username' ← (never deeper)  can only go forward (back to step 3)
 */
type Step = 1 | 2 | 'edit-username' | 3;

const TOTAL_VISIBLE_STEPS = 3;

const STEP_COPY: Record<Step, { title: string; blurb: string; cta: string }> = {
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
  'edit-username': {
    title: 'Change your handle',
    blurb: 'Your email is already verified — just update the username.',
    cta: 'Save & continue',
  },
  3: {
    title: 'Almost there',
    blurb: 'Add your name — a photo is optional, you can change it later.',
    cta: 'Create account',
  },
};

/** Maps the internal step to the visible dot index (1–3). */
const visibleStep = (s: Step): number => (s === 'edit-username' ? 2 : (s as number));

const Register = ({ setIsLogin }: RegisterFormProps) => {
  const saved = loadSignupSession();
  const [step, setStep] = useState<Step>(saved?.step ?? 1);
  const [email, setEmail] = useState(saved?.email ?? '');
  const [signupToken, setSignupToken] = useState(saved?.signupToken ?? '');
  const [username, setUsername] = useState(saved?.username ?? '');
  const [otpResent, setOtpResent] = useState(false);

  const startSignUp = useStartSignUpMutation();
  const resendOtp = useResendSignUpOtpMutation();
  const verifyOtp = useVerifySignUpOtpMutation();
  const updateUsername = useUpdateSignupUsernameMutation();
  const completeSignUp = useCompleteSignUpMutation();

  const pending =
    startSignUp.isPending ||
    verifyOtp.isPending ||
    updateUsername.isPending ||
    completeSignUp.isPending ||
    resendOtp.isPending;

  // Persist wizard state — 'edit-username' collapses back to step 3 on reload
  // (no need to re-enter username edit if user refreshes; they land on step 3)
  useEffect(() => {
    const persistedStep = step === 'edit-username' ? 3 : step;
    saveSignupSession({ step: persistedStep, email, signupToken, username });
  }, [step, email, signupToken, username]);

  // Auto-clear the "fresh code sent" banner after 8 s
  useEffect(() => {
    if (!otpResent) return;
    const timer = window.setTimeout(() => setOtpResent(false), 8000);
    return () => window.clearTimeout(timer);
  }, [otpResent]);

  // ── Step handlers ─────────────────────────────────────────────────────────

  const onStep1 = async (data: RegisterStep1Form) => {
    try {
      const { data: { email: confirmedEmail } } = await startSignUp.mutateAsync(data);
      setEmail(confirmedEmail);
      setOtpResent(false);
      setStep(2);
    } catch (error) {
      toast.error(toErrorMessage(error));
    }
  };

  const onStep2 = async ({ otp, username: chosenUsername }: RegisterStep2Form) => {
    try {
      const { data: { signupToken: token } } = await verifyOtp.mutateAsync({
        email,
        otp,
        username: chosenUsername,
      });
      setSignupToken(token);
      setUsername(chosenUsername);
      setOtpResent(false);
      setStep(3);
    } catch (error) {
      toast.error(toErrorMessage(error));
    }
  };

  const onEditUsername = async ({ username: newUsername }: RegisterEditUsernameForm) => {
    try {
      await updateUsername.mutateAsync({ signupToken, username: newUsername });
      setUsername(newUsername);
      setStep(3);
    } catch (error) {
      toast.error(toErrorMessage(error));
    }
  };

  const onStep3 = async ({ name }: RegisterStep3Form, avatar: File | null) => {
    try {
      const formData = new FormData();
      formData.append('signupToken', signupToken);
      formData.append('name', name);
      if (avatar) formData.append('avatar', avatar);
      await completeSignUp.mutateAsync(formData);
      clearSignupSession();
      // Cookie + store + GuestOnly redirect — no toast needed
    } catch (error) {
      toast.error(toErrorMessage(error));
    }
  };

  const onResend = async () => {
    try {
      await resendOtp.mutateAsync({ email });
      setOtpResent(true);
    } catch (error) {
      toast.error(toErrorMessage(error));
    }
  };

  // ── Navigation ────────────────────────────────────────────────────────────

  /**
   * Full restart: clears session + all state.
   * Used when back is pressed before OTP is verified (step 2 without a token).
   */
  const restartSignup = () => {
    clearSignupSession();
    setStep(1);
    setEmail('');
    setSignupToken('');
    setUsername('');
    setOtpResent(false);
  };

  /**
   * Back from step 2:
   * - If OTP is already verified (signupToken exists) the user shouldn't be on
   *   step 2 at all — this is a guard; send them to step 3.
   * - Otherwise clear and restart from step 1 (no partial state to preserve).
   */
  const onBackFromStep2 = () => {
    if (signupToken) {
      setStep(3);
    } else {
      restartSignup();
    }
  };

  /**
   * Back from step 3:
   * - User is verified. Show the lightweight "edit username" screen instead of
   *   sending them back through OTP.
   */
  const onBackFromStep3 = () => setStep('edit-username');

  const copy = STEP_COPY[step];
  const dotIndex = visibleStep(step);

  return (
    <div className="auth-face-body flex h-full flex-col text-left">
      <div className="auth-signup-steps" aria-label={`Step ${dotIndex} of ${TOTAL_VISIBLE_STEPS}`}>
        {([1, 2, 3] as const).map((n) => (
          <span
            key={n}
            className={`auth-signup-steps__dot ${
              n === dotIndex ? 'is-active' : n < dotIndex ? 'is-done' : ''
            }`}
          />
        ))}
        <span className="auth-signup-steps__label">
          Step {dotIndex} of {TOTAL_VISIBLE_STEPS}
        </span>
      </div>

      <h2 className="mt-4 font-display text-[1.7rem] leading-none tracking-tight text-white">
        {copy.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-body-300">{copy.blurb}</p>

      {step === 1 && (
        <RegisterStep1
          pending={pending}
          onSubmit={onStep1}
          onSwitchToLogin={() => setIsLogin(true)}
          cta={copy.cta}
        />
      )}
      {step === 2 && (
        <RegisterStep2
          email={email}
          otpResent={otpResent}
          pending={pending}
          onSubmit={onStep2}
          onResend={onResend}
          onBack={onBackFromStep2}
          cta={copy.cta}
        />
      )}
      {step === 'edit-username' && (
        <RegisterEditUsername
          currentUsername={username}
          pending={pending}
          onSubmit={onEditUsername}
          onBack={() => setStep(3)}
          cta={copy.cta}
        />
      )}
      {step === 3 && (
        <RegisterStep3
          pending={pending}
          onSubmit={onStep3}
          onBack={onBackFromStep3}
          cta={copy.cta}
        />
      )}
    </div>
  );
};

export default Register;
