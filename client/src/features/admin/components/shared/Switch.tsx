type Props = {
  on: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  /** Colour when on. Kill switches use red. */
  tone?: 'green' | 'red';
};

/** A labelled on/off switch (`role="switch"`), shared by the admin pages. */
const Switch = ({ on, onChange, label, disabled = false, tone = 'green' }: Props) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!on)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green ${
      on ? (tone === 'red' ? 'bg-red' : 'bg-green') : 'bg-white/15'
    }`}
  >
    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
  </button>
);

export default Switch;
