import { useEffect, useRef } from 'react';

type Props = {
  message: string;
  onDismiss: () => void;
};

const AUTO_HIDE_MS = 6000;

/** Inline, dismissible notice. Never swallowed, but clears itself so it doesn't linger. */
export default function ChatAlert({ message, onDismiss }: Props) {
  const dismissRef = useRef(onDismiss);
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);
  // Restarts when the message changes, so a new error always gets its full time.
  useEffect(() => {
    const t = setTimeout(() => dismissRef.current(), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <div className="acr-alert" role="alert">
      <span className="acr-alert__icon" aria-hidden>!</span>
      <p>{message}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
