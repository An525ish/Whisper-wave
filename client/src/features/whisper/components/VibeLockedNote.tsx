import WhisperDialog from './WhisperDialog';

type Props = {
  partnerName: string;
  /** 0-1. Only picks the wording; no numbers are ever shown. */
  progress: number;
  onDismiss: () => void;
};

/** Words change with how the chat is going. Nobody sees a message count or a timer. */
const copyFor = (name: string, progress: number): { title: string; body: string } => {
  if (progress <= 0)
    return { title: 'Say something first', body: `Start talking with ${name}. Vibes open once the two of you get a real conversation going.` };
  if (progress < 0.34)
    return { title: 'Just getting started', body: 'Keep it going. Quick replies back and forth are what count.' };
  if (progress < 0.67)
    return { title: 'This is going well', body: `Stay with ${name} a little longer. Long gaps pause the clock.` };
  return { title: 'Almost there', body: 'A few more replies and you can send a vibe.' };
};

/**
 * Shown when someone taps the vibe heart before the gate opens. A short modal,
 * wording only: the gate is based on sustained back-and-forth, and we don't hand
 * out the numbers so it can't be gamed.
 */
export default function VibeLockedNote({ partnerName, progress, onDismiss }: Props) {
  const { title, body } = copyFor(partnerName, progress);
  return (
    <WhisperDialog
      open
      onClose={onDismiss}
      labelledBy="vibe-locked-title"
      describedBy="vibe-locked-body"
    >
      <h2 id="vibe-locked-title" className="text-lg font-semibold text-white">{title}</h2>
      <p id="vibe-locked-body" className="mt-2 text-sm leading-relaxed text-body-300">{body}</p>
      <div
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-label="Vibe progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
      >
        <span
          className="block h-full rounded-full bg-gradient-green transition-[width] duration-500"
          style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }}
        />
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="mt-5 w-full rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-body-300 transition-colors hover:text-white"
      >
        Got it
      </button>
    </WhisperDialog>
  );
}
