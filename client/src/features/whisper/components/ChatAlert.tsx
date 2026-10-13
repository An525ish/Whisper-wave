type Props = {
  message: string;
  onDismiss: () => void;
};

/** Inline, dismissible error — a socket error must never be swallowed. */
export default function ChatAlert({ message, onDismiss }: Props) {
  return (
    <div className="acr-alert" role="alert">
      <p>{message}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
