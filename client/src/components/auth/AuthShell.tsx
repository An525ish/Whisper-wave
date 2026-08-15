import type { ReactNode } from 'react';
import AuthBrandArt from '@/components/auth/AuthBrandArt';

type AuthShellProps = {
  headline: string;
  subcopy: string;
  modeHint?: string;
  mode?: 'login' | 'register' | 'forgot' | 'admin';
  children: ReactNode;
};

const AuthShell = ({
  headline,
  subcopy,
  modeHint,
  mode = 'login',
  children,
}: AuthShellProps) => {
  return (
    <div className="auth-shell relative flex bg-background text-body md:min-h-dvh">
      <div className="auth-ambience pointer-events-none fixed inset-0 md:absolute" aria-hidden>
        <div className="auth-ambience__mesh" />
        <div className="auth-ambience__glow auth-ambience__glow--a" />
        <div className="auth-ambience__glow auth-ambience__glow--b" />
        <div className="auth-ambience__glow auth-ambience__glow--c" />
        <svg
          className="auth-ambience__ripples"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle className="auth-ripple auth-ripple--1" cx="400" cy="400" r="90" />
          <circle className="auth-ripple auth-ripple--2" cx="400" cy="400" r="160" />
          <circle className="auth-ripple auth-ripple--3" cx="400" cy="400" r="240" />
          <circle className="auth-ripple auth-ripple--4" cx="400" cy="400" r="330" />
          <path
            className="auth-ambience__sine"
            d="M40 400 C 120 320, 200 480, 280 400 S 440 320, 520 400 S 680 480, 760 400"
          />
        </svg>
        <div className="auth-ambience__signal" aria-hidden>
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="auth-ambience__grain" />
        <div className="auth-ambience__vignette" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1180px] grid-cols-1 md:flex-1 md:grid-cols-[1.05fr_0.95fr] md:items-stretch">
        <aside className="relative flex flex-col px-5 pb-0 pt-5 sm:px-8 md:min-h-dvh md:px-10 md:py-12 lg:px-14 lg:py-14">
          {/* Desktop brand column */}
          <div className="hidden min-h-0 flex-1 flex-col items-center justify-center gap-8 py-8 text-center md:flex">
            <div className="auth-wordmark select-none">
              <div className="auth-wordmark__lockup">
                <span className="auth-wordmark__glyph" aria-hidden>
                  <img src="/logo-4.png" alt="" />
                </span>
                <div className="auth-wordmark__copy">
                  <h1
                    className="auth-wordmark__title font-display tracking-[-0.03em]"
                    aria-label="Whisper Wave"
                  >
                    <span aria-hidden className="auth-wordmark__text">
                      <span className="auth-wordmark__rest">hisper</span>
                      <span className="auth-wordmark__wave">Wave</span>
                    </span>
                  </h1>
                  <p className="auth-wordmark__sub">{subcopy}</p>
                </div>
              </div>
            </div>

            <AuthBrandArt mode={mode} />

            <div className="auth-mode-line">
              <div className="auth-mode-line__rule" />
              <p className="auth-mode-line__hint">
                {modeHint ?? 'Connected'}
              </p>
              <h2 className="auth-mode-line__headline">{headline}</h2>
            </div>
          </div>

          {/* Mobile — wordmark + illustration */}
          <div className="flex flex-col items-center gap-2 text-center md:hidden">
            <div className="auth-wordmark">
              <div className="auth-wordmark__lockup">
                <span
                  className="auth-wordmark__glyph auth-wordmark__glyph--sm"
                  aria-hidden
                >
                  <img src="/logo-4.png" alt="" />
                </span>
                <div className="auth-wordmark__copy">
                  <h1
                    className="auth-wordmark-mobile font-display tracking-tight text-white"
                    aria-label="Whisper Wave"
                  >
                    <span aria-hidden className="auth-wordmark__text">
                      <span className="auth-wordmark__rest">hisper</span>
                      <span className="auth-wordmark__wave">Wave</span>
                    </span>
                  </h1>
                  <p className="auth-wordmark__sub">{subcopy}</p>
                </div>
              </div>
            </div>
            <AuthBrandArt mode={mode} />
          </div>
        </aside>

        <main className="relative flex items-start justify-center px-4 pb-6 pt-2 sm:px-6 sm:pb-8 md:items-center md:px-8 md:py-12 lg:pr-12 lg:pl-4">
          <div className="auth-panel-wrap relative w-full max-w-[420px]">
            <div className="auth-panel-orbit hidden md:block" aria-hidden />
            <div className="auth-panel relative overflow-hidden">
              <div className="auth-panel__sheen hidden md:block" aria-hidden />
              <div className="auth-panel__body relative z-[1] flex flex-col p-5 sm:p-8">
                {modeHint ? (
                  <header className="auth-panel__mode">
                    <p className="auth-panel__mode-label">{modeHint}</p>
                  </header>
                ) : null}
                <div className="flex min-h-0 flex-1 flex-col">{children}</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthShell;
