type Props = {
  partnerName: string;
  onLike: () => void;
  onDismiss: () => void;
};

/** The partner already sent a vibe — invite the user to reciprocate. */
export default function VibeNudge({ partnerName, onLike, onDismiss }: Props) {
  return (
    <div className="acr-vibe-nudge" role="status">
      <div className="acr-vibe-nudge__copy">
        <p className="acr-vibe-nudge__title">{partnerName} said they&apos;re vibing</p>
        <p className="acr-vibe-nudge__sub">Same for you?</p>
      </div>
      <button type="button" className="acr-vibe-nudge__cta" onClick={onLike}>
        I&apos;m vibing too
      </button>
      <button
        type="button"
        className="acr-vibe-nudge__dismiss"
        aria-label="Dismiss"
        onClick={onDismiss}
      >
        ×
      </button>
    </div>
  );
}
