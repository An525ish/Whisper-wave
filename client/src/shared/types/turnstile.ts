/** Cloudflare Turnstile explicit-render API (the subset we use). */
export type TurnstileRenderOptions = {
  sitekey: string;
  theme?: 'auto' | 'light' | 'dark';
  size?: 'normal' | 'flexible' | 'compact';
  callback?: (token: string) => void;
  'error-callback'?: (code: string) => void;
  'expired-callback'?: () => void;
  'timeout-callback'?: () => void;
  'before-interactive-callback'?: () => void;
  'after-interactive-callback'?: () => void;
};

export type TurnstileApi = {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string | undefined;
  remove: (widgetId: string) => void;
  reset: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Where the widget is in its life, as the UI needs it. */
export type TurnstileStatus = 'loading' | 'ready' | 'interactive' | 'solved' | 'error';

/** Why it failed: the script never loaded (blocker/offline), the widget errored, or it timed out. */
export type TurnstileErrorKind = 'blocked' | 'widget' | 'timeout';
