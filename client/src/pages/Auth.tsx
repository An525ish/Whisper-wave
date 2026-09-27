import { AuthShell } from '@/features/auth';
import { ForgotPasswordForm as ForgotPassword } from '@/features/auth';
import { LoginForm as Login } from '@/features/auth';
import { RegisterForm as Register } from '@/features/auth';
import { useState } from 'react';

const PRODUCT_VOICE =
  'Anonymous when you want. Connected when it clicks.';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForget, setIsForget] = useState(false);

  const mode = isForget ? 'forgot' : isLogin ? 'login' : 'register';

  const headline = isForget
    ? 'A quiet reset.'
    : isLogin
      ? 'Pick up the thread.'
      : 'Make some noise — gently.';

  const modeHint = isForget
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
      subcopy={PRODUCT_VOICE}
      modeHint={modeHint}
      mode={mode}
    >
      {isForget ? (
        <ForgotPassword setIsForget={setIsForget} />
      ) : (
        <div
          className={`auth-flip ${isLogin ? '' : 'auth-flip--back'}`}
        >
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
