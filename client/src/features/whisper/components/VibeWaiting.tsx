/** We've sent our vibe and are waiting on them. */
export default function VibeWaiting() {
  return (
    <div className="acr-vibe-wait" role="status">
      <span className="acr-vibe-wait__dot" aria-hidden />
      You sent a vibe — waiting for them…
    </div>
  );
}
