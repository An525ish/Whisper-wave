import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { loadTurnstile } from '@/shared/lib/turnstile';
import type { TurnstileErrorKind, TurnstileStatus } from '@/shared/types/turnstile';

interface Params {
  siteKey: string;
  /** When false nothing loads or renders (the caller is showing an error first). */
  enabled?: boolean;
  onToken: (token: string) => void;
}

type State = { status: TurnstileStatus; error: TurnstileErrorKind | null };
const LOADING: State = { status: 'loading', error: null };

/**
 * Mounts one Turnstile widget into `containerRef`, removes it on unmount (no
 * leaks) and reports its status. `retry()` tears the widget down and builds a
 * fresh one (re-loading the script if it was blocked). An expired token resets
 * the widget by itself.
 */
export function useTurnstile({ siteKey, enabled = true, onToken }: Params) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<State>(LOADING);
  const [attempt, setAttempt] = useState(0);
  const emitToken = useEffectEvent(onToken);

  useEffect(() => {
    const container = containerRef.current;
    if (!enabled || !container) return;
    let cancelled = false;
    let widgetId: string | undefined;
    const fail = (error: TurnstileErrorKind) => {
      if (!cancelled) setState({ status: 'error', error });
    };

    loadTurnstile()
      .then((api) => {
        if (cancelled) return;
        widgetId = api.render(container, {
          sitekey: siteKey,
          theme: 'dark',
          size: 'normal',
          callback: (token) => {
            if (cancelled) return;
            setState({ status: 'solved', error: null });
            emitToken(token);
          },
          'before-interactive-callback': () => !cancelled && setState({ status: 'interactive', error: null }),
          'after-interactive-callback': () => !cancelled && setState({ status: 'ready', error: null }),
          'expired-callback': () => {
            if (cancelled || widgetId === undefined) return;
            api.reset(widgetId);
            setState({ status: 'ready', error: null });
          },
          'timeout-callback': () => fail('timeout'),
          'error-callback': () => fail('widget'),
        });
        if (widgetId === undefined) fail('widget');
        else setState({ status: 'ready', error: null });
      })
      .catch(() => fail('blocked'));

    return () => {
      cancelled = true;
      if (widgetId !== undefined) window.turnstile?.remove(widgetId);
    };
  }, [siteKey, enabled, attempt]);

  const retry = () => {
    setState(LOADING);
    setAttempt((n) => n + 1);
  };

  return { containerRef, status: state.status, error: state.error, retry };
}
