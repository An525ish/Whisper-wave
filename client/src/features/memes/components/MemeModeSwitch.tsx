import Dialog from '@/shared/components/ui/modal/Dialog';
import { useMemeModeSwitch } from '../hooks/useMemeModeSwitch';
import MemeSignInDialog from './MemeSignInDialog';

const ADULT_TITLE_ID = 'mm-adult-title';

/**
 * Unfiltered-feed opt-in switch (18+). Default off for everyone; guests are
 * sent to sign in, members confirm 18+ once per enable. All decisions live in
 * `useMemeModeSwitch`.
 */
const MemeModeSwitch = () => {
  const { on, busy, flip, adultOpen, guestOpen, confirmAdult, closeAdult, closeGuest } =
    useMemeModeSwitch();

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

      <Dialog open={adultOpen} onClose={closeAdult} labelledBy={ADULT_TITLE_ID}>
        <h2 id={ADULT_TITLE_ID} className="font-display text-xl text-white">
          Turn on unfiltered?
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-body-300">
          No filters — jokes may be explicit, sexual, or offensive, and the Dark shelf
          opens up. Confirm you&apos;re 18 or older.
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
          onClick={closeAdult}
          className="mt-2 w-full rounded-full px-5 py-2 text-sm font-medium text-body-300 transition hover:text-body focus-visible:outline-2 focus-visible:outline-green"
        >
          Not now
        </button>
      </Dialog>

      <MemeSignInDialog
        open={guestOpen}
        onClose={closeGuest}
        title="Sign in for unfiltered"
        body="Unfiltered jokes live behind an account — and an 18+ check."
      />
    </>
  );
};

export default MemeModeSwitch;
