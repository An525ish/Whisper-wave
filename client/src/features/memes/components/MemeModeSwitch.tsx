import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/features/auth';
import { ROUTES } from '@/shared/constants/routes';
import { useMemeMode, useSetMemeMode } from '../hooks/useMemeMode';
import './memes.css';

/**
 * Unfiltered-feed opt-in switch. Default off for everyone; guests are sent
 * to sign in, members confirm 18+ once per enable. The stored flag flips
 * through the mutation, and the feed swaps streams on the mode key — the
 * switch itself never touches joke data.
 */
const MemeModeSwitch = () => {
  const user = useAuthStore((s) => s.user);
  const { data: mode } = useMemeMode();
  const setMode = useSetMemeMode();
  const [adultOpen, setAdultOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);

  const on = mode === true;
  const busy = setMode.isPending;

  useEffect(() => {
    if (!adultOpen && !guestOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAdultOpen(false);
        setGuestOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [adultOpen, guestOpen]);

  const flip = () => {
    if (busy) return;
    if (!user) {
      setGuestOpen(true);
      return;
    }
    if (!on) {
      setAdultOpen(true);
      return;
    }
    setMode.mutate(
      { unfiltered: false },
      { onError: () => toast.error('Couldn’t turn it off — try again.') }
    );
  };

  const confirmAdult = () => {
    setAdultOpen(false);
    setMode.mutate(
      { unfiltered: true, confirmAdult: true },
      { onError: () => toast.error('Couldn’t turn it on — try again.') }
    );
  };

  return (
    <>
      <div className="mm-mode">
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Unfiltered jokes, 18 and over"
          onClick={flip}
          disabled={busy}
          className={`mm-switch${on ? ' mm-switch--on' : ''}`}
        >
          <span aria-hidden className="mm-switch__knob" />
        </button>
        <span className="mm-mode__label">
          Unfiltered
          <span className="mm-mode__badge">18+</span>
        </span>
      </div>

      {adultOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 grid place-items-center p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mm-adult-title"
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-black/60 backdrop-blur-[6px]"
              onClick={() => setAdultOpen(false)}
            />
            <div className="relative w-full max-w-xs rounded-3xl border border-white/10 bg-gradient-to-b from-[#2a2136] to-[#1a1520] p-6 text-center shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
              <h2 id="mm-adult-title" className="font-display text-xl text-white">
                Turn on unfiltered?
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-body-300">
                No filters — jokes may be explicit, sexual, or offensive.
                Confirm you&apos;re 18 or older.
              </p>
              <button
                type="button"
                onClick={confirmAdult}
                className="mt-4 w-full rounded-full bg-gradient-action-button-green px-5 py-2.5 text-sm font-semibold text-body transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-green"
              >
                I&apos;m 18+, turn it on
              </button>
              <button
                type="button"
                onClick={() => setAdultOpen(false)}
                className="mt-2 w-full rounded-full px-5 py-2 text-sm font-medium text-body-300 transition hover:text-body focus-visible:outline-2 focus-visible:outline-green"
              >
                Not now
              </button>
            </div>
          </div>,
          document.body
        )}

      {guestOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 grid place-items-center p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mm-guest-title"
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute inset-0 bg-black/60 backdrop-blur-[6px]"
              onClick={() => setGuestOpen(false)}
            />
            <div className="relative w-full max-w-xs rounded-3xl border border-white/10 bg-gradient-to-b from-[#2a2136] to-[#1a1520] p-6 text-center shadow-[0_28px_80px_rgba(0,0,0,0.55)]">
              <h2 id="mm-guest-title" className="font-display text-xl text-white">
                Sign in for unfiltered
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-body-300">
                Unfiltered jokes live behind an account — and an 18+ check.
              </p>
              <Link
                to={ROUTES.authLogin}
                className="mt-4 block rounded-full bg-gradient-action-button-green px-5 py-2.5 text-sm font-semibold text-body transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-green"
              >
                Sign in
              </Link>
              <button
                type="button"
                onClick={() => setGuestOpen(false)}
                className="mt-2 w-full rounded-full px-5 py-2 text-sm font-medium text-body-300 transition hover:text-body focus-visible:outline-2 focus-visible:outline-green"
              >
                Not now
              </button>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default MemeModeSwitch;
