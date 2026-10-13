type Props = {
  partnerName: string;
  onLike: () => void;
  onDismiss: () => void;
};

/**
 * The one-shot "vibe check" prompt — the moment the gate opens.
 *
 * Dismissible, but NOT the only path to liking — the header heart is always
 * available, so a user who taps "Not really" can still change their mind.
 */
export default function VibePrompt({ partnerName, onLike, onDismiss }: Props) {
  return (
    <div className="acr-vibe-prompt" role="status">
      <span className="acr-vibe-prompt__icon" aria-hidden>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1 7.8 7.7 7.8-7.7 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      </span>

      <div className="acr-vibe-prompt__copy">
        <p className="acr-vibe-prompt__kicker">Vibes unlocked</p>
        <p className="acr-vibe-prompt__title">You and {partnerName} vibing?</p>
        <p className="acr-vibe-prompt__sub">
          If it clicks, you can open a real DM — totally optional.
        </p>
      </div>

      <div className="acr-vibe-prompt__actions">
        <button type="button" className="acr-vibe-prompt__yes" onClick={onLike}>
          Yeah, we&apos;re vibing
        </button>
        <button type="button" className="acr-vibe-prompt__nah" onClick={onDismiss}>
          Not really
        </button>
      </div>
    </div>
  );
}
