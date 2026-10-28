import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';

type Props = {
  signedIn: boolean;
  /** In-flight whisper connections awaiting their person. */
  pendingCount: number;
  onNavigate: (id: string) => void;
};

/**
 * Closing section. Guests get a plain "no account needed" invitation, never a
 * wall. Members get pending connections first, then chats.
 */
const HomeFooter = ({ signedIn, pendingCount, onNavigate }: Props) =>
  !signedIn ? (
    <footer className="hw-closing hw-rise" style={{ '--hw-d': '270ms' } as React.CSSProperties}>
      <span aria-hidden className="hw-closing__rings" />
      <p className="hw-closing__pill">
        <span aria-hidden className="hw-live-dot h-1.5 w-1.5 rounded-full bg-green" />
        No account needed
      </p>
      <h2 className="hw-closing__title">
        Start now. <span className="hw-iri italic">Sign up later.</span>
      </h2>
      <p className="hw-closing__desc">
        Start as a guest. Make an account only if you want to keep someone you matched with.
      </p>
      <div className="hw-closing__actions">
        <Link to={ROUTES.whisper} onClick={() => onNavigate('whisper')} className="hw-show__go">
          Find someone
        </Link>
        <Link
          to={ROUTES.authLogin}
          onClick={() => onNavigate('signup-prompt')}
          className="hw-closing__ghost"
        >
          Create account
        </Link>
      </div>
    </footer>
  ) : (
  <footer
    className="hw-glass hw-rim hw-rise relative overflow-hidden rounded-3xl p-5 md:p-6"
    style={{ '--hw-d': '270ms' } as React.CSSProperties}
  >
    <div aria-hidden className="hw-cardglow hw-cardglow--shore" />
    <div className="relative">
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
                {'. Finish connecting with someone you matched.'}
              </span>
            </span>
            <span className="shrink-0 text-sm font-medium text-green">View</span>
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
              <span className="block font-semibold text-white">Your chats</span>
              <span>Continue with people you kept.</span>
            </span>
          </span>
          <span className="shrink-0 text-sm font-medium text-green transition group-hover:translate-x-0.5">Open chats</span>
        </Link>
      </div>
    </div>
  </footer>
);

export default HomeFooter;
