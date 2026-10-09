import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import AuthAmbience from './AuthAmbience';
import WaitingRadar from './WaitingRadar';
import type { VibeTag } from '../types';
import './whisperShared.css';
import './waitingRoom.css';

type Props = {
  displayName: string;
  socketConnected: boolean;
  /** The socket dropped and is retrying; the server holds the match meanwhile. */
  reconnecting: boolean;
  /** Approximate number of people queued. 0 means "nobody is here right now". */
  queueSize: number | null;
  /** The user's own vibes, shown floating around the radar (wave bar kept clear). */
  vibeTags: VibeTag[];
  /** Restoring a chat after a refresh, not searching for a new one. */
  resuming?: boolean;
  onLeave: () => void;
};

export default function WaitingRoom({
  displayName,
  socketConnected,
  reconnecting,
  queueSize,
  vibeTags,
  resuming = false,
  onLeave,
}: Props) {
  const degraded = !resuming && (reconnecting || !socketConnected);
  // The wr-* keyframes are applied as inline `animation` styles, which a
  // stylesheet rule can't reliably override — so honour the preference here too.
  const calm = useMediaQuery('(prefers-reduced-motion: reduce)');

  // Honest empty-state: with a small audience the honest thing is to say so
  // rather than spin an infinite "searching" animation that implies activity.
  const emptyQueue = !resuming && queueSize !== null && queueSize <= 1;

  return (
    <main className="auth-shell relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background text-body">
      {/* Auth ambience */}
      <AuthAmbience />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-7 px-4 text-center">

        {/* Stage — decorative, so hidden from assistive tech */}
        <div className="auth-stage wr-stage relative" aria-hidden>
          <div className="auth-stage__glow" />
          <div className="auth-stage__orbit auth-stage__orbit--outer" />
          <div className="auth-stage__orbit auth-stage__orbit--mid" />

          {/* Concentric rings */}
          <svg className="auth-stage__rings" viewBox="0 0 360 360" fill="none">
            <circle className="auth-stage__ring" cx="180" cy="180" r="78" />
            <circle className="auth-stage__ring auth-stage__ring--b" cx="180" cy="180" r="118" />
            <circle className="auth-stage__ring auth-stage__ring--c" cx="180" cy="180" r="158" />
            <path className="auth-stage__arc" d="M52 180 A128 128 0 0 1 180 52" strokeLinecap="round" />
          </svg>

          <WaitingRadar queueSize={resuming ? null : queueSize} vibeTags={resuming ? [] : vibeTags} quiet={emptyQueue} />

          {/* Center — two chat bubbles converging. When nobody else is queued
              the right bubble dims: a literal depiction of "no one to talk to
              yet" rather than two identically-cheerful bubbles implying a
              connection that's already happening. */}
          <div className="absolute left-1/2 top-[46%] z-10 -translate-x-1/2 -translate-y-1/2">
            {emptyQueue && (
              <div className="absolute inset-0 -z-10 m-auto h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(90,63,214,0.14),transparent_70%)]" />
            )}
            <div className="relative flex items-center justify-center">
              {/* Left bubble */}
              <div
                className="relative"
                style={{ animation: calm ? 'none' : 'wr-bubble-l 4s ease-in-out infinite' }}
              >
                <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
                  <path
                    d="M2 6 Q2 2 6 2 H28 Q32 2 32 6 V20 Q32 24 28 24 H20 L14 30 V24 H6 Q2 24 2 20 Z"
                    fill="rgba(90,63,214,0.18)"
                    stroke="rgba(90,63,214,0.55)"
                    strokeWidth="1.5"
                  />
                  {/* typing dots */}
                  {[7, 13, 19].map((x, i) => (
                    <circle
                      key={i}
                      cx={x} cy="13" r="2.2"
                      fill="rgba(139,107,255,0.9)"
                      style={{ animation: calm ? 'none' : `wr-dots 1.4s ease-in-out ${i * 0.22}s infinite` }}
                    />
                  ))}
                </svg>
              </div>

              {/* Connecting dot */}
              <div className="mx-1 h-1 w-1 rounded-full bg-green/60" style={{ animation: calm ? 'none' : 'auth-pulse-dot 1.8s ease-in-out infinite' }} />

              {/* Right bubble — the one still out there waiting for you */}
              <div
                className="relative transition-opacity duration-700"
                style={{
                  animation: calm ? 'none' : 'wr-bubble-r 4.5s ease-in-out infinite',
                  opacity: emptyQueue ? 0.32 : 1,
                }}
              >
                <svg width="44" height="40" viewBox="0 0 44 40" fill="none">
                  <path
                    d="M42 6 Q42 2 38 2 H16 Q12 2 12 6 V20 Q12 24 16 24 H24 L30 30 V24 H38 Q42 24 42 20 Z"
                    fill="rgba(1,195,109,0.12)"
                    stroke="rgba(1,195,109,0.45)"
                    strokeWidth="1.5"
                  />
                  {[25, 31, 37].map((x, i) => (
                    <circle
                      key={x}
                      cx={x} cy="13" r="2.2"
                      fill="rgba(1,195,109,0.8)"
                      style={{ animation: calm ? 'none' : `wr-dots 1.4s ease-in-out ${0.1 + i * 0.22}s infinite` }}
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>

          {/* Wave bar */}
          <div className="auth-stage__wave">
            {Array.from({ length: 24 }, (_, i) => (
              <span key={i} className="auth-stage__bar" style={{ animationDelay: `${(i % 8) * 0.1}s` }} />
            ))}
          </div>
        </div>

        {/* Text */}
        <div>
          <h1 className="font-display text-[1.9rem] font-bold leading-none tracking-tight text-white">
            {resuming
              ? 'Reconnecting to your chat'
              : emptyQueue
                ? 'Quiet in the void'
                : 'Searching the void'}
            <span style={{ animation: calm ? 'none' : 'wr-cursor 1.1s step-start infinite' }}>
              {resuming || emptyQueue ? '…' : '_'}
            </span>
          </h1>
          <p className="mt-2 text-sm text-body-500">
            {resuming
              ? 'Hang tight — picking up right where you left off.'
              : emptyQueue
              ? 'You’re first in. Keep this tab open — we’ll link you the moment someone else arrives.'
              : 'Vibes in the distance — finding the right one'}
          </p>
        </div>

        {/* Identity card */}
        <div
          className="w-full rounded-2xl px-5 py-4"
          style={{
            background: 'radial-gradient(120% 80% at 50% -10%, rgba(1,195,109,0.1) 0%, transparent 55%), linear-gradient(165deg, rgba(57,48,70,0.72) 0%, rgba(42,33,54,0.88) 100%)',
            border: '1px solid rgba(235,236,236,0.09)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.35), inset 0 1px 0 rgba(235,236,236,0.07)',
            backdropFilter: 'blur(18px)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                aria-hidden
                style={{
                  background: degraded
                    ? reconnecting
                      ? 'rgba(236, 195, 71, 0.95)'
                      : 'rgba(255, 88, 99, 0.95)'
                    : 'var(--color-green)',
                  boxShadow: degraded
                    ? undefined
                    : '0 0 8px rgba(1,195,109,0.7)',
                  animation: calm ? 'none' : 'auth-pulse-dot 2.4s ease-in-out infinite',
                }}
              />
              <div className="min-w-0 text-left">
                <span className="truncate text-sm text-body-400">
                  {resuming ? (
                    'Restoring your thread'
                  ) : (
                    <>
                      Searching as <span className="font-semibold text-white">{displayName}</span>
                    </>
                  )}
                </span>
                {!resuming && queueSize !== null && (
                  <p className="text-[11px] text-body-700">
                    {queueSize <= 1
                      ? 'Just you so far'
                      : `${queueSize} ${queueSize === 2 ? 'person' : 'people'} waiting`}
                  </p>
                )}
                {degraded && (
                  <p className="text-[11px] text-amber-200/90" role="status">
                    {reconnecting ? 'Reconnecting…' : 'Connection lost — retrying…'}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onLeave}
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-body-500 transition-all hover:border-red/20 hover:text-red"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Leave
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
