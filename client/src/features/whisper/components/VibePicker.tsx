import { PRODUCT_VOICE } from '@/shared/constants/app';
import VibePickerForm from './VibePickerForm';
import type { JoinQueuePayload } from '../types';
import './whisperShared.css';

type Props = {
  onJoin: (payload: JoinQueuePayload) => void;
  loading: boolean;
  error: string | null;
};

/**
 * Entry screen shell: ambience, wordmark, panel chrome.
 * The form itself lives in `VibePickerForm`.
 */
export default function VibePicker({ onJoin, loading, error }: Props) {
  return (
    <div className="auth-shell relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background text-body">
      <div className="auth-ambience pointer-events-none fixed inset-0" aria-hidden>
        <div className="auth-ambience__mesh" />
        <div className="auth-ambience__glow auth-ambience__glow--a" />
        <div className="auth-ambience__glow auth-ambience__glow--b" />
        <div className="auth-ambience__glow auth-ambience__glow--c" />
        <svg className="auth-ambience__ripples" viewBox="0 0 800 800" fill="none">
          <circle className="auth-ripple auth-ripple--1" cx="400" cy="400" r="90" />
          <circle className="auth-ripple auth-ripple--2" cx="400" cy="400" r="160" />
          <circle className="auth-ripple auth-ripple--3" cx="400" cy="400" r="240" />
          <circle className="auth-ripple auth-ripple--4" cx="400" cy="400" r="330" />
          <path className="auth-ambience__sine" d="M40 400 C 120 320, 200 480, 280 400 S 440 320, 520 400 S 680 480, 760 400" />
        </svg>
        <div className="auth-ambience__signal" aria-hidden>
          <span /><span /><span /><span />
        </div>
        <div className="auth-ambience__grain" />
        <div className="auth-ambience__vignette" />
      </div>

      {/* A little wider than the auth panel (max-w-105) so the preset chip row
          fits on two lines instead of three ragged ones. Not much wider — the
          form is a single column, so extra width would just stretch the fields. */}
      <div className="relative z-10 w-full max-w-120 px-4 py-10">
        <div className="mb-7 flex justify-center">
          <div className="auth-wordmark">
            <div
              className="auth-wordmark__lockup"
              style={{ fontSize: 'clamp(2.2rem,7vw,3rem)' }}
            >
              <span className="auth-wordmark__glyph auth-wordmark__glyph--sm" aria-hidden>
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
                <p className="auth-wordmark__sub">{PRODUCT_VOICE}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-panel-wrap relative">
          <div className="auth-panel-orbit hidden md:block" aria-hidden />
          <div className="auth-panel relative overflow-hidden">
            <div className="auth-panel__sheen hidden md:block" aria-hidden />
            <div
              className="auth-panel__body relative z-1 px-5 pt-6 pb-6 sm:px-9 sm:pt-8 sm:pb-7"
              style={{ minHeight: 0 }}
            >
              <header className="auth-panel__mode mb-6">
                <p className="auth-panel__mode-label">Enter the void</p>
              </header>

              <VibePickerForm onJoin={onJoin} loading={loading} error={error} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
