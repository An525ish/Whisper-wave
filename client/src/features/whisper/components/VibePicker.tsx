import { PRODUCT_VOICE } from '@/shared/constants/app';
import AlreadyChattingModal from './AlreadyChattingModal';
import AuthAmbience from './AuthAmbience';
import VibePickerForm from './VibePickerForm';
import type { JoinQueuePayload } from '../types';
import './whisperShared.css';

type Props = {
  onJoin: (payload: JoinQueuePayload) => void;
  loading: boolean;
  error: string | null;
  alreadyChatting: boolean;
  onDismissAlreadyChatting: () => void;
};

/**
 * Entry screen shell: ambience, wordmark, panel chrome.
 * The form itself lives in `VibePickerForm`.
 */
export default function VibePicker({
  onJoin,
  loading,
  error,
  alreadyChatting,
  onDismissAlreadyChatting,
}: Props) {
  return (
    <main className="auth-shell vp-shell relative flex min-h-dvh flex-col items-center justify-start overflow-x-clip overflow-y-auto bg-background text-body sm:justify-center">
      <AuthAmbience />
      {alreadyChatting && <AlreadyChattingModal onClose={onDismissAlreadyChatting} />}

      {/* A little wider than the auth panel (max-w-105) so the preset chip row
          fits on two lines instead of three ragged ones. Not much wider — the
          form is a single column, so extra width would just stretch the fields. */}
      <div className="vp-frame relative z-10 w-full max-w-120 px-3 py-6 sm:px-4 sm:py-10">
        <div className="vp-wordmark mb-5 flex justify-center sm:mb-7">
          <div className="auth-wordmark">
            <div
              className="auth-wordmark__lockup"
              style={{ fontSize: 'clamp(1.85rem,6.5vw,3rem)' }}
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
              className="auth-panel__body vp-panel-body relative z-1 px-3.5 pt-4 pb-4 sm:px-9 sm:pt-8 sm:pb-7"
              style={{ minHeight: 0 }}
            >
              <header className="auth-panel__mode vp-mode mb-4 sm:mb-6">
                <p className="auth-panel__mode-label">Enter the void</p>
              </header>

              <VibePickerForm onJoin={onJoin} loading={loading} />
            </div>
          </div>
        </div>

        {/* Below the card, not in it: this is about the last attempt (a chat that
            ended, a session that lapsed), not about anything in the form. A quiet
            line rather than a box — it is information, not a blocker. */}
        {error && (
          <p
            role="alert"
            className="mt-5 flex items-center justify-center gap-2 text-center text-[13px] leading-snug text-body-700"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-body-700"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8v5" />
              <path d="M12 16.5h.01" />
            </svg>
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
