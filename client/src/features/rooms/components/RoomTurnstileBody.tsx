import { useState } from 'react';
import { useTurnstile } from '@/shared/hooks/useTurnstile';
import type { RoomChallengeCode } from '../types/challenge';

type Props = {
  siteKey: string;
  /** Why the modal is (re)opening: a failed or unavailable check starts in the error state, not another auto-run. */
  code: RoomChallengeCode;
  /** The token is on its way to the server. */
  busy: boolean;
  onToken: (token: string) => void;
};

const COPY = {
  blocked:
    'We couldn’t load the check. Turn off content blockers for challenges.cloudflare.com or try again.',
  widget: 'The check hit a snag. Give it another go.',
  timeout: 'The check timed out. Give it another go.',
  unavailable: 'We couldn’t reach the check service. Try again in a moment.',
  failed: 'That check didn’t go through. Give it another go.',
} as const;

/** The Turnstile widget, centred, with a calm one-line status and a retry for every failure. */
const RoomTurnstileBody = ({ siteKey, code, busy, onToken }: Props) => {
  // After a rejected check we wait for "Try again" instead of burning another attempt.
  const [armed, setArmed] = useState(code === 'challenge_required');
  const { containerRef, status, error, retry } = useTurnstile({ siteKey, enabled: armed, onToken });

  const problem = !armed
    ? code === 'challenge_unavailable'
      ? COPY.unavailable
      : COPY.failed
    : error
      ? COPY[error]
      : null;
  const loading = armed && status === 'loading';

  const tryAgain = () => {
    setArmed(true);
    retry();
  };

  return (
    <div className="rm-chal__body">
      <div className={`rm-chal__widget${armed && !problem ? '' : ' rm-chal__widget--off'}`}>
        {loading && <span className="rm-chal__skeleton" aria-hidden />}
        <div ref={containerRef} className="rm-chal__mount" />
      </div>
      {problem ? (
        <div role="alert" className="rm-chal__problem">
          <p className="rm-chal__status rm-chal__status--err">{problem}</p>
          <button type="button" onClick={tryAgain} className="rm-chal__btn">
            Try again
          </button>
        </div>
      ) : (
        <p role="status" className="rm-chal__status">
          {loading
            ? 'Getting things ready…'
            : status === 'interactive' && !busy
              ? 'Tap the box to continue'
              : 'Checking…'}
        </p>
      )}
    </div>
  );
};

export default RoomTurnstileBody;
