type AuthBrandArtProps = {
  mode?: 'login' | 'register' | 'forgot' | 'admin';
};

/**
 * Quiet-circle stage with phone scene — brand mark lives with the wordmark, not here.
 */
const AuthBrandArt = ({ mode = 'login' }: AuthBrandArtProps) => {
  const isAdmin = mode === 'admin';

  return (
    <div className={`auth-stage auth-stage--${mode}`} aria-hidden>
      <div className="auth-stage__glow" />

      <img
        src={isAdmin ? '/images/admin-console-scene.svg' : '/images/auth-wave-scene.svg'}
        alt=""
        className="auth-stage__phone"
        draggable={false}
      />

      <svg
        className="auth-stage__rings"
        viewBox="0 0 360 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle className="auth-stage__ring auth-stage__ring--a" cx="180" cy="180" r="78" />
        <circle className="auth-stage__ring auth-stage__ring--b" cx="180" cy="180" r="118" />
        <circle className="auth-stage__ring auth-stage__ring--c" cx="180" cy="180" r="158" />
        <path
          className="auth-stage__arc"
          d="M52 180 A128 128 0 0 1 180 52"
          strokeLinecap="round"
        />
      </svg>

      <div className="auth-stage__wave">
        {Array.from({ length: 28 }, (_, i) => (
          <span
            key={i}
            className="auth-stage__bar"
            style={{ animationDelay: `${(i % 10) * 0.08}s` }}
          />
        ))}
      </div>

      <div className="auth-stage__chip auth-stage__chip--a">
        <span className={`auth-stage__chip-dot${isAdmin ? ' auth-stage__chip-dot--blue' : ''}`} />
        {isAdmin ? 'secure access' : 'quietly online'}
      </div>
      <div className="auth-stage__chip auth-stage__chip--b">
        {isAdmin ? 'ops console' : 'new thread'}
      </div>
    </div>
  );
};

export default AuthBrandArt;
