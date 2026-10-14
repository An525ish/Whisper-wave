type Props = {
  onOpen: () => void;
};

/** In-toast offer: a whisper just became a real chat; open it when ready, don't yank the user away. */
const OpenDmToast = ({ onOpen }: Props) => (
  <div
    role="status"
    className="flex items-center gap-3 rounded-2xl border border-border bg-primary px-4 py-3 text-sm text-body shadow-lg"
  >
    <span>You’re connected — say hi ✨</span>
    <button
      type="button"
      onClick={onOpen}
      className="rounded-full bg-green px-3 py-1 text-xs font-semibold text-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
    >
      Open DM
    </button>
  </div>
);

export default OpenDmToast;
