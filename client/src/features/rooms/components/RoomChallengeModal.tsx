import { useEffect } from 'react';
import Dialog from '@/shared/components/ui/modal/Dialog';
import RoomArithmeticBody from './RoomArithmeticBody';
import RoomTurnstileBody from './RoomTurnstileBody';
import type { RoomPendingChallenge } from '../types/challenge';
import './roomChallenge.css';

type Props = {
  pending: RoomPendingChallenge;
  busy: boolean;
  /** Arithmetic fallback: the typed sum. */
  answerError: string | null;
  onAnswer: (raw: string) => void;
  onToken: (token: string) => void;
  /** Close the modal; the unsent text stays in the composer. */
  onCancel: () => void;
};

const SUCCESS_MS = 700;
const TITLE_ID = 'room-challenge-title';
const DESC_ID = 'room-challenge-desc';

/**
 * First-post check for guests, in the shared Dialog. The held message is re-sent
 * by the composer the moment the check clears; this modal then plays a short
 * "You're in" beat and closes. Cancel (button, Esc, backdrop) keeps the draft.
 */
const RoomChallengeModal = ({ pending, busy, answerError, onAnswer, onToken, onCancel }: Props) => {
  const { challenge, passed } = pending;

  useEffect(() => {
    if (!passed) return;
    const timer = window.setTimeout(onCancel, SUCCESS_MS);
    return () => window.clearTimeout(timer);
  }, [passed, onCancel]);

  return (
    <Dialog
      open
      onClose={onCancel}
      labelledBy={TITLE_ID}
      describedBy={DESC_ID}
      rootClassName="rm-chal__root"
      backdropClassName="rm-chal__backdrop"
      panelClassName="rm-chal"
    >
      <span className={`rm-chal__ring${passed ? ' rm-chal__ring--ok' : ''}`} aria-hidden>
        <svg viewBox="0 0 24 24" className="rm-chal__icon" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path className="rm-chal__shield" d="M12 3 4.5 6v5.5c0 4.4 3.1 8.1 7.5 9.5 4.4-1.4 7.5-5.1 7.5-9.5V6L12 3Z" />
          <path className="rm-chal__tick" pathLength={1} d="m8.8 12.2 2.3 2.3 4.2-4.6" />
        </svg>
      </span>

      {passed ? (
        <p id={TITLE_ID} role="status" className="rm-chal__title rm-chal__title--ok">
          You’re in
        </p>
      ) : (
        <>
          <h2 id={TITLE_ID} className="rm-chal__title">
            Quick check
          </h2>
          <p id={DESC_ID} className="rm-chal__sub">
            One tap and you’re chatting — this keeps Rooms free of bots.
          </p>
          {challenge.provider === 'turnstile' ? (
            <RoomTurnstileBody
              key={pending.nonce}
              siteKey={challenge.siteKey}
              code={pending.code}
              busy={busy}
              onToken={onToken}
            />
          ) : (
            <RoomArithmeticBody
              key={pending.nonce}
              prompt={challenge.prompt}
              failed={pending.code === 'challenge_failed'}
              error={answerError}
              busy={busy}
              onAnswer={onAnswer}
            />
          )}
          <button type="button" onClick={onCancel} className="rm-chal__cancel">
            Cancel
          </button>
        </>
      )}
    </Dialog>
  );
};

export default RoomChallengeModal;
