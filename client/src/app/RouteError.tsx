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
          : 'Reload the page and try again. Your chats are not affected.'
      }
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
};

const ErrorScreen = ({ title, body, primary, code, detail, hint }: ErrorScreenProps) => (
  <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-background px-5 py-10 text-center">
    {/* One soft wash, same family as the hub bands. Decoration only. */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          'radial-gradient(ellipse 50% 40% at 50% 38%, rgba(139,107,255,0.16), transparent 100%), radial-gradient(ellipse 40% 30% at 50% 70%, rgba(1,195,109,0.08), transparent 100%)',
      }}
    />

    <section
      role="alert"
      className="relative flex w-full max-w-md flex-col items-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-10 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.8)] sm:px-10"
    >
      <img src="/logo-4.png" alt="" className="size-14 rounded-2xl" />

      {code ? (
        <p className="mt-6 font-display text-6xl leading-none text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.25)]">
          {code}
        </p>
      ) : null}

      <h1 className={`${code ? 'mt-4' : 'mt-6'} font-display text-3xl leading-tight text-white`}>
        {title}
      </h1>
      <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-body-300">{body}</p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="rounded-full bg-gradient-action-button-green px-7 py-3 text-sm font-semibold text-body transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green active:scale-[0.98]"
        >
          {primary}
        </button>
        <Link
          to={ROUTES.home}
          className="rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white transition hover:border-green/40 hover:bg-green/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green active:scale-[0.98]"
        >
          Go home
        </Link>
      </div>

      {hint ? <p className="mt-6 text-xs leading-relaxed text-body-600">{hint}</p> : null}

      {detail ? (
        <details className="mt-5 w-full text-left">
          <summary className="cursor-pointer text-center text-xs text-body-600 hover:text-body-300">
            Details
          </summary>
          <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] leading-relaxed text-body-300">
            {detail}
          </pre>
        </details>
      ) : null}
    </section>
  </main>
);

export default RouteError;
