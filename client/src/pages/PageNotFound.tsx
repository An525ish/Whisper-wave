import { Link, useLocation } from 'react-router-dom';

const PageNotFound = () => {
  const { pathname } = useLocation();

  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-6 py-16">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_30%,rgba(1,195,109,0.16)_0%,transparent_50%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-glass-background opacity-40"
        aria-hidden
      />

      <div
        className="pointer-events-none absolute left-[8%] top-[18%] h-40 w-40 rounded-full bg-green/10 blur-3xl animate-notfound-drift motion-reduce:animate-none sm:h-56 sm:w-56"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[6%] top-[42%] h-48 w-48 rounded-full bg-primary blur-3xl animate-notfound-drift motion-reduce:animate-none [animation-delay:-4s] sm:h-72 sm:w-72"
        aria-hidden
      />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <div
          className="relative mb-8 w-full max-w-lg sm:mb-10 md:mb-12"
          aria-hidden
        >
          <svg
            viewBox="0 0 480 340"
            className="mx-auto h-auto w-full drop-shadow-[0_20px_60px_rgba(1,195,109,0.12)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <ellipse
              cx="240"
              cy="308"
              rx="180"
              ry="28"
              fill="rgba(1,195,109,0.08)"
            />

            <g className="animate-notfound-wave motion-reduce:animate-none">
              <path
                d="M-40 258 C40 228 100 288 180 258 C260 228 320 288 400 258 C460 238 500 258 540 248 L540 340 L-40 340 Z"
                fill="rgba(42,33,54,0.9)"
              />
            </g>
            <g className="animate-notfound-wave-slow motion-reduce:animate-none">
              <path
                d="M-40 272 C50 246 110 296 200 272 C290 248 340 296 430 274 C480 262 520 274 560 268 L560 340 L-40 340 Z"
                fill="rgba(1,195,109,0.18)"
              />
            </g>
            <g className="animate-notfound-wave motion-reduce:animate-none [animation-delay:-1.2s]">
              <path
                d="M-40 288 C60 268 120 308 210 288 C300 268 360 308 450 290 C500 280 540 288 580 284 L580 340 L-40 340 Z"
                fill="rgba(1,195,109,0.32)"
              />
            </g>

            {/* Chat bubble sits clearly above the 404 */}
            <g transform="translate(0 36)">
              <g className="animate-notfound-float motion-reduce:animate-none">
                <path
                  d="M168 28 C168 10 184 -4 208 -4 H292 C316 -4 332 10 332 28 V64 C332 82 316 96 292 96 H236 L208 118 V96 H208 C184 96 168 82 168 64 Z"
                  fill="rgba(42,33,54,0.95)"
                  stroke="rgba(1,195,109,0.45)"
                  strokeWidth="2"
                />
                <circle cx="214" cy="46" r="7" fill="rgba(1,195,109,0.7)" />
                <circle
                  cx="240"
                  cy="46"
                  r="7"
                  fill="rgba(1,195,109,0.5)"
                  className="animate-loader-dot motion-reduce:animate-none [animation-delay:160ms]"
                />
                <circle
                  cx="266"
                  cy="46"
                  r="7"
                  fill="rgba(1,195,109,0.3)"
                  className="animate-loader-dot motion-reduce:animate-none [animation-delay:320ms]"
                />
              </g>
            </g>

            <ellipse
              cx="250"
              cy="164"
              rx="36"
              ry="8"
              className="animate-notfound-ripple motion-reduce:animate-none"
              stroke="rgba(1,195,109,0.25)"
              strokeWidth="1.5"
              fill="none"
            />

            <text
              x="240"
              y="255"
              textAnchor="middle"
              fill="rgba(235,236,236,0.1)"
              style={{
                fontSize: 140,
                fontWeight: 600,
                letterSpacing: '-0.04em',
              }}
            >
              404
            </text>
            <text
              x="240"
              y="255"
              textAnchor="middle"
              fill="none"
              stroke="rgba(1,195,109,0.4)"
              strokeWidth="1.5"
              style={{
                fontSize: 140,
                fontWeight: 600,
                letterSpacing: '-0.04em',
              }}
            >
              404
            </text>
          </svg>
        </div>

        <p className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-5xl">
          Whisper Wave
        </p>

        <h1 className="mt-4 max-w-xl text-xl font-medium text-body sm:mt-5 sm:text-2xl md:text-3xl">
          This whisper drifted off the map
        </h1>

        <p className="mt-3 max-w-md text-sm leading-relaxed text-body-300 sm:text-base md:text-lg">
          Whatever you were looking for isn’t on this frequency. The wave moved
          on — let’s get you back to shore.
        </p>

        {pathname && pathname !== '/' ? (
          <p className="mt-4 max-w-full truncate font-mono text-xs text-body-300 sm:text-sm">
            no signal at <span className="text-green">{pathname}</span>
          </p>
        ) : null}

        <Link
          to="/"
          className="mt-8 inline-flex min-h-12 items-center justify-center rounded-3xl bg-gradient-action-button-green px-8 text-base font-medium text-body outline-none transition-opacity hover:opacity-90 sm:mt-10 sm:min-h-14 sm:px-10 sm:text-lg"
        >
          Return to shore
        </Link>
      </div>

      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28 overflow-hidden sm:h-36"
        aria-hidden
      >
        <svg
          className="absolute bottom-0 h-full w-[200%] animate-notfound-wave-band motion-reduce:animate-none"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 60 C180 20 360 100 540 60 C720 20 900 100 1080 60 C1260 20 1380 50 1440 60 L1440 120 L0 120 Z"
            fill="rgba(1,195,109,0.08)"
          />
          <path
            d="M0 80 C200 40 400 110 600 80 C800 50 1000 110 1200 80 C1320 60 1400 70 1440 80 L1440 120 L0 120 Z"
            fill="rgba(1,195,109,0.14)"
          />
        </svg>
      </div>
    </main>
  );
};

export default PageNotFound;
