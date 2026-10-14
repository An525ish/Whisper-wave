import type { TurnstileApi } from '@/shared/types/turnstile';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let loading: Promise<TurnstileApi> | null = null;

/**
 * Load Cloudflare's Turnstile script once, on demand (third-party script, first
 * guest post only). One shared promise; a failure clears it so a retry loads again.
 */
export const loadTurnstile = (): Promise<TurnstileApi> => {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  loading ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script');
    const fail = () => {
      loading = null;
      script.remove();
      reject(new Error('Turnstile script failed to load'));
    };
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : fail());
    script.onerror = fail;
    document.head.appendChild(script);
  });
  return loading;
};
