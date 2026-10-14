import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

type Props = {
  signedIn: boolean;
  /** In-flight whisper connections awaiting their person. */
  pendingCount: number;
  onNavigate: (id: string) => void;
};

/**
 * The shoreline: what (or whom) waits for you. Guests get the soft account
 * pitch — never a wall. Members get pending connections first, then chats.
 */
const HomeFooter = ({ signedIn, pendingCount, onNavigate }: Props) => (
  <footer
    className="hw-glass hw-rim hw-rise relative overflow-hidden rounded-3xl p-5 md:p-6"
    style={{ '--hw-d': '270ms' } as React.CSSProperties}
  >
    <div aria-hidden className="hw-cardglow hw-cardglow--shore" />
    <div className="relative">
      {signedIn ? (
        <div className="flex flex-col gap-3">
          {pendingCount > 0 && (
            <Link
              to={ROUTES.chats}
              onClick={() => onNavigate('pending')}
              className="flex items-center justify-between gap-3 rounded-2xl border border-green/25 bg-green/[0.07] px-4 py-3 transition hover:bg-green/[0.12] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            >
              <span className="flex items-center gap-2.5 text-sm text-body-300">
                <span aria-hidden className="hw-live-dot h-2 w-2 shrink-0 rounded-full bg-green" />
                <span>
                  <span className="font-semibold text-white">
                    {pendingCount === 1 ? '1 connection waiting' : `${pendingCount} connections waiting`}
                  </span>
                  {' — someone you vibed with.'}
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium text-green">View →</span>
            </Link>
          )}
          <Link
            to={ROUTES.chats}
            onClick={() => onNavigate('chats')}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 transition hover:border-green/30 hover:bg-white/[0.045] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
          >
            <span className="flex items-center gap-3 text-sm text-body-300">
              <svg viewBox="0 0 32 32" fill="none" aria-hidden className="h-9 w-9 shrink-0">
                <circle cx="11" cy="13" r="6" fill="#1d1530" stroke="#8b6bff" strokeWidth="1.5" />
                <circle cx="21" cy="13" r="6" fill="#122b28" stroke="#35e0c8" strokeWidth="1.5" />
                <path d="M6 26 q5 -6 10 0 M16 26 q5 -6 10 0" stroke="rgba(235,236,236,0.35)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <span>
                <span className="block font-semibold text-white">Your people</span>
                <span>pick up where you left off.</span>
              </span>
            </span>
            <span className="shrink-0 text-sm font-medium text-green transition group-hover:translate-x-0.5">Open Chats →</span>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <svg viewBox="0 0 48 48" fill="none" aria-hidden className="h-12 w-12 shrink-0">
            <circle cx="24" cy="24" r="20" stroke="rgba(1,195,109,0.35)" strokeWidth="1.5" strokeDasharray="3 6" />
            <circle cx="24" cy="24" r="13" fill="#1d1530" stroke="#8b6bff" strokeWidth="1.5" />
            <path d="M17 22 h14 a1.5 1.5 0 0 1 0 3 H17 a1.5 1.5 0 0 1 0-3 Z" fill="#b6a4ff" />
            <circle cx="21" cy="28" r="2" fill="#8b6bff" />
            <circle cx="27" cy="28" r="2" fill="#35e0c8" />
          </svg>
          <p className="text-sm leading-relaxed text-body-300">
            <span className="font-display text-lg text-white">Just looking around?</span>
            <br />
            No account needed. When you find someone worth keeping,{' '}
            <Link
              to={ROUTES.authLogin}
              onClick={() => onNavigate('signup-prompt')}
              className="font-medium text-green underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
            >
              make an account to keep them
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  </footer>
);

export default HomeFooter;
