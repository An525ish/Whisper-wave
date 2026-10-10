/**
 * Home hero — midnight-shore greeting beside the cove stage, not under it.
 *
 * Split layout (copy left, HomeStage right) at the auth/landing illustration
 * level: a live status pill, a greeting that knows the time, the Whisper
 * current as the hero action plus a quiet rooms doorway, and a trust row so
 * the promise (no names, no history) is said once, plainly.
 *
 * Presentational only: all numbers and flags arrive as props, so this file
 * never fetches and never decides. The atmosphere layer is decorative
 * (`aria-hidden`) and fully still under `prefers-reduced-motion`.
 */
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import HomeStage from './HomeStage';
import './home.css';

type Props = {
  userName: string | null;
  /** e.g. "27 of 30 left today". Absent for guests and on failure. */
  quotaText?: string;
  /** Members at zero are beached honestly instead of linked to a refusal. */
  quotaExhausted: boolean;
  /** People in open rooms right now. */
  liveCount: number;
  /** Rooms surface enabled — shows the quiet secondary doorway. */
  roomsLive?: boolean;
  onWhisperClick: () => void;
  onRoomsClick?: () => void;
};

const hourGreeting = (hour: number): string => {
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 22) return 'Good evening';
  return 'Up late?';
};

/** Deterministic starfield — fixed seed, so every visit shares one sky. */
const STARS: Array<{ left: string; top: string; size: number; delay: string; dim: boolean }> = (() => {
  let seed = 20261010;
  const rand = (): number => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  return Array.from({ length: 28 }, () => ({
    left: `${(rand() * 100).toFixed(1)}%`,
    top: `${(rand() * 62).toFixed(1)}%`,
    size: rand() > 0.82 ? 2 : 1,
    delay: `${(rand() * 6).toFixed(1)}s`,
    dim: rand() > 0.5,
  }));
})();

const HomeHero = ({
  userName,
  quotaText,
  quotaExhausted,
  liveCount,
  roomsLive = false,
  onWhisperClick,
  onRoomsClick,
}: Props) => {
  const greeting = userName
    ? `${hourGreeting(new Date().getHours())}${userName ? `, ${userName}` : ''}`
    : 'Where do you want to start?';

  return (
    <header className="hw-hero hw-glass hw-rim relative overflow-hidden rounded-3xl md:rounded-[2rem]">
      <div aria-hidden className="hw-atmo">
        <div className="hw-aurora left-[8%] top-[-20%] h-64 w-64 opacity-70" style={{ background: 'radial-gradient(circle, rgba(139,107,255,0.5), transparent 66%)' }} />
        <div className="hw-aurora right-[4%] top-[30%] h-56 w-56 opacity-60" style={{ background: 'radial-gradient(circle, rgba(53,224,200,0.35), transparent 68%)', animationDelay: '-11s' }} />
        <div className="hw-moon" />
        <div className="hw-tide" />
        {STARS.map((star, i) => (
          <span
            key={i}
            className={`hw-star${star.dim ? ' hw-star-dim' : ''}`}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              animationDelay: star.delay,
            }}
          />
        ))}
        <div className="hw-grain" />
      </div>

      <div className="relative grid items-center gap-8 px-6 py-10 md:grid-cols-[1.02fr_0.98fr] md:gap-6 md:px-10 md:py-14 lg:px-12">
        {/* ── copy ── */}
        <div className="text-center md:text-left">
          <p className="hw-statuspill mx-auto md:mx-0">
            <span aria-hidden className="hw-statuspill__dot" />
            {liveCount > 0 ? (
              <span>
                <span className="font-semibold text-white">{liveCount}</span>{' '}
                {liveCount === 1 ? 'person drifting now' : 'people drifting now'}
              </span>
            ) : (
              <span>quiet water tonight</span>
            )}
          </p>

          <p className="mt-5 text-xs font-medium uppercase tracking-[0.28em] text-green">
            Whisper Wave
          </p>
          <h1 className="mx-auto mt-3 max-w-xl font-display text-4xl leading-[1.05] text-white md:mx-0 md:text-5xl">
            {greeting}
            <span className="hw-iri block italic">the night is open.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-body-300 md:mx-0 md:text-base">
            One stranger, one room, one shuffled laugh — no names, no history,
            nothing kept. Pick the water that fits your mood.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
            {quotaExhausted ? (
              <p className="mx-auto max-w-xs rounded-full border border-border/60 px-6 py-3.5 text-sm font-medium text-body-300 md:mx-0">
                Back tomorrow — the wave rests too.
              </p>
            ) : (
              <Link
                to={ROUTES.whisper}
                onClick={onWhisperClick}
                className="hw-sheen inline-block rounded-full bg-gradient-action-button-green px-9 py-3.5 text-base font-semibold text-body shadow-[0_8px_32px_-8px_rgba(1,195,109,0.6)] transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green active:scale-[0.98]"
              >
                Find someone →
              </Link>
            )}
            {roomsLive && !quotaExhausted && (
              <Link
                to={ROUTES.rooms}
                onClick={onRoomsClick}
                className="inline-block rounded-full border border-white/15 bg-white/[0.04] px-7 py-3.5 text-sm font-semibold text-white transition hover:border-green/40 hover:bg-green/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green active:scale-[0.98]"
              >
                Browse rooms
              </Link>
            )}
          </div>
          {quotaText && (
            <p className="mt-2.5 text-xs font-medium text-green">{quotaText}</p>
          )}
          {!quotaText && !quotaExhausted && (
            <p className="mt-2.5 text-xs text-body-300">
              One stranger. No names, no history — just the moment.
            </p>
          )}

          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 md:justify-start">
            {['No names', 'No history', 'Leaves no trace'].map((t) => (
              <li key={t} className="hw-hud flex items-center gap-2 text-body-300">
                <span aria-hidden className="h-1 w-1 rounded-full bg-green" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        {/* ── stage ── */}
        <div className="mx-auto w-full max-w-[420px] md:mx-0 md:ml-auto md:max-w-none">
          <HomeStage liveCount={liveCount} />
        </div>
      </div>
    </header>
  );
};

export default HomeHero;
