import { useEffect } from 'react';
import { isRouteErrorResponse, Link, useRouteError } from 'react-router-dom';

const RELOAD_KEY = 'ww:chunk-reload-at';
const RELOAD_COOLDOWN_MS = 15_000;

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
  const detail =
    error instanceof Error
      ? error.message
      : isRouteErrorResponse(error)
        ? error.statusText
        : 'Something went wrong';

  if (staleChunk) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
        <div>
          <p className="font-display text-2xl text-white">Updating Whisper Wave…</p>
          <p className="mt-2 text-sm text-body-300">
            A newer version is available. Refreshing…
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
      <div className="max-w-md">
        <p className="font-display text-3xl text-white">
          {status ? `${status}` : 'Something went wrong'}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-body-300">{detail}</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-3xl bg-gradient-action-button-green px-5 py-2.5 text-sm font-medium text-body"
          >
            Reload
          </button>
          <Link to="/" className="text-sm font-medium text-green hover:text-green/85">
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
};

export default RouteError;
