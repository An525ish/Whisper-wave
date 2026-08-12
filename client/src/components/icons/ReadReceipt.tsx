type ReadReceiptProps = {
  read?: boolean;
  className?: string;
};

const CHECK = 'M1.1 6.4 L3.6 8.9 L9.1 3.1';

const ReadReceipt = ({ read = false, className = '' }: ReadReceiptProps) => {
  const strokeProps = {
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.35,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (!read) {
    return (
      <svg
        className={`block h-[11px] w-[11px] shrink-0 opacity-70 ${className}`}
        viewBox="0 0 11 11"
        aria-hidden
      >
        <path d={CHECK} {...strokeProps} />
      </svg>
    );
  }

  return (
    <svg
      className={`block h-[11px] w-[17px] shrink-0 text-green ${className}`}
      viewBox="0 0 17 11"
      aria-hidden
    >
      <path d={CHECK} {...strokeProps} />
      <path d={CHECK} transform="translate(5 0)" {...strokeProps} />
    </svg>
  );
};

export default ReadReceipt;
