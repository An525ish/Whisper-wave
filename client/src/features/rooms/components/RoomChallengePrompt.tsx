import { useState, type FormEvent } from 'react';
import { ROOM_LIMITS } from '../constants';
import type { RoomChallenge } from '../types';

type Props = {
  challenge: RoomChallenge;
  /** The last answer was wrong. */
  failed: boolean;
  /** Local "not a number" complaint, before anything is sent. */
  error: string | null;
  busy: boolean;
  onAnswer: (raw: string) => void;
  onCancel: () => void;
};

/** First-post check for guests: "7 + 4 = ?" answered inline, then the same message goes out. */
const RoomChallengePrompt = ({ challenge, failed, error, busy, onAnswer, onCancel }: Props) => {
  const [value, setValue] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onAnswer(value);
  };

  return (
    <form onSubmit={submit} className="rm-challenge" aria-label="Quick check before your first post">
      <label htmlFor="room-challenge-answer" className="rm-challenge__q">
        Quick check: <b>{challenge.prompt}</b> =
      </label>
      <input
        id="room-challenge-answer"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        inputMode="numeric"
        autoComplete="off"
        autoFocus
        maxLength={ROOM_LIMITS.CHALLENGE_ANSWER_MAX}
        aria-invalid={failed || error !== null}
        className="rm-challenge__input"
      />
      <button type="submit" disabled={busy || value.trim() === ''} className="rm-challenge__btn">
        {busy ? 'Checking…' : 'Verify'}
      </button>
      <button type="button" onClick={onCancel} className="rm-challenge__cancel">
        Cancel
      </button>
      {(failed || error) && (
        <p role="alert" className="rm-challenge__err">
          {error ?? 'That wasn’t right — try the new one.'}
        </p>
      )}
    </form>
  );
};

export default RoomChallengePrompt;
