import { useState, type FormEvent } from 'react';
import { ROOM_LIMITS } from '../constants';

type Props = {
  prompt: string;
  /** The last answer was wrong. */
  failed: boolean;
  /** Local "not a number" complaint, before anything is sent. */
  error: string | null;
  busy: boolean;
  onAnswer: (raw: string) => void;
};

/** Dev/CI fallback check inside the challenge modal: "7 + 4 = ?" answered inline. */
const RoomArithmeticBody = ({ prompt, failed, error, busy, onAnswer }: Props) => {
  const [value, setValue] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onAnswer(value);
  };

  return (
    <form onSubmit={submit} className="rm-chal__math">
      <label htmlFor="room-challenge-answer" className="rm-chal__q">
        <b>{prompt}</b> =
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
        className="rm-chal__input"
      />
      <button type="submit" disabled={busy || value.trim() === ''} className="rm-chal__btn">
        {busy ? 'Checking…' : 'Verify'}
      </button>
      {(failed || error) && (
        <p role="alert" className="rm-chal__status rm-chal__status--err">
          {error ?? 'That wasn’t right — try the new one.'}
        </p>
      )}
    </form>
  );
};

export default RoomArithmeticBody;
