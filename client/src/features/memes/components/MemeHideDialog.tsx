import Dialog from '@/shared/components/ui/modal/Dialog';
type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const TITLE_ID = 'meme-hide-title';
const DESC_ID = 'meme-hide-desc';

const PANEL =
  'relative w-full max-w-sm rounded-[1.75rem] border border-white/10 bg-gradient-to-b from-[#2a2136] to-[#1a1520] p-5 text-left shadow-[0_28px_80px_rgba(0,0,0,0.55)] sm:p-6';

/** Confirm before hiding a joke: it stays hidden on this device. */
const MemeHideDialog = ({ open, onClose, onConfirm }: Props) => (
  <Dialog open={open} onClose={onClose} labelledBy={TITLE_ID} describedBy={DESC_ID} panelClassName={PANEL}>
    <div className="flex items-start gap-3">
      <span
        aria-hidden
        className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/12 bg-white/[0.06] text-body"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c7 0 11 8 11 8a18.6 18.6 0 0 1-2.2 3.1M6.6 6.6C3.8 8.3 2 13 2 13s4 8 10 8a9.6 9.6 0 0 0 4.4-1.1" />
          <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
          <path d="M3 3l18 18" />
        </svg>
      </span>
      <div className="min-w-0">
        <h2 id={TITLE_ID} className="font-display text-xl leading-tight text-white">
          Hide this joke?
        </h2>
        <p id={DESC_ID} className="mt-1 text-sm leading-snug text-body-300">
          It won&apos;t show up again on this device. Nobody else is told.
        </p>
      </div>
    </div>

    <div className="mt-5 flex gap-2">
      <button
        type="button"
        onClick={onClose}
        className="h-11 flex-1 rounded-2xl border border-white/10 text-sm font-medium text-body-300 transition hover:bg-white/5 hover:text-body focus-visible:outline-2 focus-visible:outline-green"
      >
        Keep it
      </button>
      <button
        type="button"
        onClick={() => {
          onConfirm();
          onClose();
        }}
        className="h-11 flex-[1.4] rounded-2xl bg-gradient-green text-sm font-semibold text-white transition active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
      >
        Hide it
      </button>
    </div>
  </Dialog>
);

export default MemeHideDialog;
