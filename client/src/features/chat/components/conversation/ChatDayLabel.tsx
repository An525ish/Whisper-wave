type ChatDayLabelProps = {
  label: string;
  className?: string;
};

const dayChipClass =
  'rounded-full border border-border/45 bg-background-alt/65 px-3 py-1 text-[11px] font-medium tracking-wide text-body-700/90 backdrop-blur-sm';

const todayChipClass =
  'inline-flex items-center gap-1.5 rounded-full border border-green/18 bg-background-alt/55 px-3 py-1 text-[11px] font-medium tracking-wide text-green/90 shadow-[0_2px_14px_rgba(1,195,109,0.06)] backdrop-blur-sm ring-1 ring-inset ring-green/8';

/** Faded at outer edge → soft green tint toward the Today chip. */
const lineFadeToChip =
  'h-px flex-1 bg-linear-to-r from-transparent from-0% via-border/15 via-55% to-green/12 to-100%';

const lineFadeFromChip =
  'h-px flex-1 bg-linear-to-l from-transparent from-0% via-border/15 via-55% to-green/12 to-100%';

const ChatDayLabel = ({ label, className = '' }: ChatDayLabelProps) => {
  if (label === 'Today') {
    return (
      <div className={`flex w-full max-w-sm items-center gap-2 sm:max-w-md ${className}`}>
        <span className={lineFadeToChip} aria-hidden />
        <time className={todayChipClass}>
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-green/85 shadow-[0_0_6px_rgba(1,195,109,0.32)]"
            aria-hidden
          />
          {label}
        </time>
        <span className={lineFadeFromChip} aria-hidden />
      </div>
    );
  }

  return (
    <time className={`${dayChipClass} ${className}`}>
      {label}
    </time>
  );
};

export default ChatDayLabel;
