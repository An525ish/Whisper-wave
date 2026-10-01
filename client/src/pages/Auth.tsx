import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/features/auth';
import { ForgotPasswordForm as ForgotPassword } from '@/features/auth';
import { LoginForm as Login } from '@/features/auth';
import { RegisterForm as Register } from '@/features/auth';
import { WhisperConnectNotice, whisperAuthCopy } from '@/features/whisper';
import { PRODUCT_VOICE } from '@/shared/constants/app';
import { useAnonStore } from '@/features/whisper';

/**
 * Auth route entry. Composes feature components and reads route state only —
 * the whisper-connect concern (token decode, alias precedence, origin-story
 * copy) lives in the feature, not here.
 */
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForget, setIsForget] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isWhisperConnect =
    (location.state as { intent?: string } | null)?.intent === 'whisper-connect';

  const storeAlias = useAnonStore((s) => s.displayName);
  const partnerAlias = useAnonStore((s) => s.partnerName);

  const mode = isForget ? 'forgot' : isLogin ? 'login' : 'register';
  const copy = whisperAuthCopy(isWhisperConnect, storeAlias || undefined, partnerAlias || undefined);

  const headline =
    copy?.headline ??
    (isForget ? 'A quiet reset.' : isLogin ? 'Pick up the thread.' : 'Make some noise — gently.');

  const modeHint = isWhisperConnect
    ? 'Keep the connection'
    : isForget
      ? 'Forgot password'
      : isLogin
        ? 'Sign in'
        : 'Create account';

  const switchMode = (nextLogin: boolean) => {
    setIsForget(false);
    setIsLogin(nextLogin);
  };

  return (
    <AuthShell
      headline={headline}
      subcopy={copy?.subcopy ?? PRODUCT_VOICE}
      modeHint={modeHint}
      mode={mode}
    >
      <WhisperConnectNotice
        active={isWhisperConnect}
        onStayAnonymous={() => navigate('/whisper', { replace: true })}
      />

      {isForget ? (
        <ForgotPassword setIsForget={setIsForget} />
      ) : (
        <div className={`auth-flip ${isLogin ? '' : 'auth-flip--back'}`}>
          <div className="auth-flip__card">
            <div className="auth-flip__face auth-flip__face--front">
              <Login setIsLogin={switchMode} setIsForget={setIsForget} />
            </div>
            <div className="auth-flip__face auth-flip__face--back">
              <Register setIsLogin={switchMode} />
            </div>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
