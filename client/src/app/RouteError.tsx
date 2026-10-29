import { useEffect } from 'react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';
import { RELOAD_KEY, RELOAD_COOLDOWN_MS } from '@/shared/constants/app';
import { ROUTES } from '@/shared/constants/routes';

function isStaleChunkError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading chunk [\d]+ failed/i.test(
    message,
  );
}

/** Catches lazy-route chunk misses after deploys and reloads once for a fresh index. */
const RouteError = () => {
  const error = useRouteError();
  const staleChunk = isStaleChunkError(error);

  useEffect(() => {
    if (!staleChunk) return;

    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    const now = Date.now();
    if (now - last < RELOAD_COOLDOWN_MS) return;

    sessionStorage.setItem(RELOAD_KEY, String(now));
    window.location.reload();
  }, [staleChunk]);

  const status = isRouteErrorResponse(error) ? error.status : null;
  // Never surface a raw thrown Error message in production (can leak internal
  // paths/identifiers). Full detail stays in development for debugging.
  const devDetail =
    import.meta.env.DEV && error instanceof Error
      ? error.message
      : isRouteErrorResponse(error)
        ? error.statusText
        : '';

  if (staleChunk) {
    return (
      <ErrorScreen
        title="Updating Whisper Wave"
        body="There's a newer version. Refreshing now."
        primary="Reload now"
        busy
      />
    );
  }

  const notFound = status === 404;
  return (
    <ErrorScreen
      title={notFound ? "That page isn't here" : 'Something broke on our side'}
      body={
        notFound
          ? 'The link may be old or mistyped.'
          : 'Reload the page and try again.'
      }
      reassure={notFound ? undefined : 'Your chats are not affected'}
      primary="Reload page"
      code={status}
      detail={devDetail}
      hint={
        import.meta.env.DEV && /Should have a queue|Rendered (more|fewer) hooks/i.test(devDetail)
          ? 'Dev only: this usually means a hot reload changed a hook. A manual reload clears it.'
          : undefined
      }
    />
  );
};

type ErrorScreenProps = {
  title: string;
  body: string;
  primary: string;
  code?: number | null;
  detail?: string;
  hint?: string;
  /** Small green reassurance pill under the body. */
  reassure?: string;
  /** Updating screens spin the rings instead of showing them broken. */
  busy?: boolean;
};

/** Wave rings around the logo. Calm state = a gap in each ring (signal lost). */
const Rings = ({ busy }: { busy?: boolean }) => (
  <div aria-hidden className="relative grid size-44 place-items-center">
    <span className="absolute inset-0 animate-ping rounded-full border border-green/20 [animation-duration:3s] motion-reduce:animate-none" />
    <svg
      viewBox="0 0 100 100"
      className={`absolute inset-0 size-full ${busy ? 'animate-spin [animation-duration:2.4s] motion-reduce:animate-none' : ''}`}
      fill="none"
      strokeLinecap="round"
    >
      <circle cx="50" cy="50" r="46" stroke="rgba(139,107,255,.45)" strokeWidth="1.5" strokeDasharray="190 100" transform="rotate(-30 50 50)" />
      <circle cx="50" cy="50" r="36" stroke="rgba(1,195,109,.5)" strokeWidth="1.5" strokeDasharray="130 96" transform="rotate(80 50 50)" />
      <circle cx="50" cy="50" r="26" stroke="rgba(255,255,255,.18)" strokeWidth="1.5" strokeDasharray="70 93" transform="rotate(200 50 50)" />
    </svg>
    <img src="/logo-4.png" alt="" className="relative size-16 rounded-2xl shadow-[0_0_40px_-6px_rgba(139,107,255,0.7)]" />
  </div>
);

const ErrorScreen = ({ title, body, primary, code, detail, hint, reassure, busy }: ErrorScreenProps) => (
  <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-5 py-10 text-center">
    {/* Soft washes plus a faint grid, decoration only. */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse 55% 45% at 50% 32%, rgba(139,107,255,0.2), transparent 100%), radial-gradient(ellipse 45% 35% at 50% 75%, rgba(1,195,109,0.1), transparent 100%)',
      }}
    />
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
    />

    <section role="alert" className="relative flex w-full max-w-lg flex-col items-center">
      <Rings busy={busy} />

      {code ? (
        <p className="mt-4 font-display text-7xl leading-none tracking-tight text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.28)]">
          {code}
        </p>
      ) : null}

      <h1 className={`${code ? 'mt-3' : 'mt-6'} font-display text-3xl leading-tight text-white sm:text-4xl`}>{title}</h1>
      <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-body-300">{body}</p>

      {reassure ? (
        <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-green/25 bg-green/10 px-3.5 py-1.5 text-xs font-medium text-green">
          <span className="size-1.5 rounded-full bg-green shadow-[0_0_8px_#01c36d]" />
          {reassure}
        </p>
      ) : null}

      <div className="mt-8 flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-gradient-action-button-green px-8 py-3.5 text-sm font-semibold text-body shadow-[0_10px_30px_-10px_rgba(1,195,109,0.8)] transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green active:scale-[0.98]"
        >
          {primary}
        </button>
        <Link
          to={ROUTES.home}
          className="rounded-full border border-white/15 bg-white/[0.04] px-8 py-3.5 text-sm font-semibold text-white transition hover:border-green/40 hover:bg-green/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green active:scale-[0.98]"
        >
          Go home
        </Link>
      </div>

      {hint ? <p className="mt-6 max-w-sm text-xs leading-relaxed text-body-600">{hint}</p> : null}

      {detail ? (
        <details className="mt-5 w-full max-w-sm text-left">
          <summary className="cursor-pointer text-center text-xs text-body-600 hover:text-body-300">Details</summary>
          <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] leading-relaxed text-body-300">
            {detail}
          </pre>
        </details>
      ) : null}
    </section>
  </main>
);

export default RouteError;
