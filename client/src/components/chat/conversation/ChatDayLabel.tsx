type ChatDayLabelProps = {
  label: string;
  className?: string;
};

const ChatDayLabel = ({ label, className = '' }: ChatDayLabelProps) => (
  <time
    className={`rounded-md px-2.5 py-1 font-display text-[12px] leading-none tracking-[0.03em] ${
      label === 'Today' ? 'bg-green-light text-green' : 'bg-body/8 text-body-700'
    } ${className}`}
  >
    {label}
  </time>
);

export default ChatDayLabel;
