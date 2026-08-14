type OlderMessagesLoaderProps = {
  visible: boolean;
};

const OlderMessagesLoader = ({ visible }: OlderMessagesLoaderProps) => {
  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading older messages"
      className="pointer-events-none absolute inset-x-0 top-[calc(max(0.5rem,env(safe-area-inset-top))+3.65rem)] z-25 flex justify-center md:top-[4.35rem]"
    >
      <div className="flex items-center gap-1.5 text-[10px] tracking-wide text-body-700/75">
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 animate-spin rounded-full border border-body-700/25 border-t-body-700/60"
        />
        Loading Chats…
      </div>
    </div>
  );
};

export default OlderMessagesLoader;
