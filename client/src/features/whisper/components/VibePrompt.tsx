type Props = {
  partnerName: string;
  onLike: () => void;
  onDismiss: () => void;
};

/**
 * The one-shot "vibe check" prompt.
 *
 * Dismissible, but NOT the only path to liking — the header heart is always
 * available, so a user who taps "Not really" can still change their mind.
 */
export default function VibePrompt({ partnerName, onLike, onDismiss }: Props) {
  return (
    <div className="acr-vibe-prompt" role="status">
      <p className="acr-vibe-prompt__kicker">Vibe check</p>
      <p className="acr-vibe-prompt__title">You and {partnerName} vibing?</p>
      <p className="acr-vibe-prompt__sub">
        If it clicks, you can open a real DM — totally optional.
      </p>
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
