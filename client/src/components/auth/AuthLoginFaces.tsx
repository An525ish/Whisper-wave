import { AVATAR_FALLBACK } from '@/constants/app';

/** Compact DP strip used atop login so it matches register avatar row height. */
const AuthLoginFaces = () => (
  <div className="auth-login-faces" aria-hidden>
    <div className="auth-login-faces__stack">
      <img src={AVATAR_FALLBACK} alt="" className="auth-login-faces__dp" />
      <img src="/logo-4.png" alt="" className="auth-login-faces__dp auth-login-faces__dp--logo" />
      <img src={AVATAR_FALLBACK} alt="" className="auth-login-faces__dp" />
    </div>
    <div className="min-w-0 text-left">
      <p className="text-sm font-medium text-white">Your wave is waiting</p>
      <p className="text-xs text-body-300">Jump back into quiet chats</p>
    </div>
  </div>
);

export default AuthLoginFaces;
