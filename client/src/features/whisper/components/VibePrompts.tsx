type PromptProps = {
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
export function VibePrompt({ partnerName, onLike, onDismiss }: PromptProps) {
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

/** The partner already sent a vibe — invite the user to reciprocate. */
export function VibeNudge({
  partnerName,
  onLike,
  onDismiss,
}: PromptProps) {
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

/** We've sent our vibe and are waiting on them. */
export function VibeWaiting() {
  return (
    <div className="acr-vibe-wait" role="status">
      <span className="acr-vibe-wait__dot" aria-hidden />
      You sent a vibe — waiting for them…
    </div>
  );
}

/** Mutual — offer the DM once the celebration modal has been dismissed. */
export function MutualBar({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="acr-mutual-bar" role="status">
      <div className="min-w-0 text-left">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-green">Mutual vibe</p>
        <p className="mt-0.5 text-xs font-medium text-body-300">
          It&apos;s a vibe — open a DM anytime
        </p>
      </div>
      <button type="button" className="acr-mutual-bar__cta" onClick={onOpen}>
        Open DM
      </button>
    </div>
  );
}

/** Inline, dismissible error — a socket error must never be swallowed. */
export function ChatAlert({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="acr-alert" role="alert">
      <p>{message}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
