import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AuthShell,
  ForgotPasswordForm as ForgotPassword,
  LoginForm as Login,
  RegisterForm as Register,
} from '@/features/auth';
import { WhisperConnectNotice, useWhisperAuthIntent } from '@/features/whisper';
import { PRODUCT_VOICE } from '@/shared/constants/app';

/**
 * Auth route entry. Composes feature components and reads route state only —
 * the whisper-connect concern (token decode, alias precedence, origin-story
 * copy) lives in the feature, not here.
 */
export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForget, setIsForget] = useState(false);
  const navigate = useNavigate();
  const { active: isWhisperConnect, copy, names } = useWhisperAuthIntent();

  const mode = isForget ? 'forgot' : isLogin ? 'login' : 'register';

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
        names={names}
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
