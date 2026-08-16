import CopyIcon from '@/components/ui/icons/Copy';
import CheckIcon from '@/components/ui/icons/Check';
import { useCopyToClipboard } from '@/hooks/shared';
import type { MouseEvent } from 'react';

type CopyButtonVariant = 'overlay' | 'tile' | 'panel';

type CopyButtonProps = {
  value: string;
  label: string;
  variant?: CopyButtonVariant;
  iconClassName?: string;
};

const CopyButton = ({
  value,
  label,
  variant = 'tile',
  iconClassName = 'h-3.5 w-3.5',
}: CopyButtonProps) => {
  const { copied, copy } = useCopyToClipboard();

  const handleCopy = (event: MouseEvent<HTMLButtonElement>) => {
    copy(value, event);
  };

  const className = (() => {
    if (variant === 'overlay') {
      return `pointer-events-auto shrink-0 rounded p-0.5 transition hover:bg-white/10 ${
        copied ? 'text-green-300' : 'text-white/45 hover:text-white/90'
      }`;
    }
    if (variant === 'panel') {
      return `shrink-0 rounded-lg p-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue/40 ${
        copied
          ? 'bg-green/15 text-green'
          : 'text-body-300/45 hover:bg-blue/10 hover:text-blue'
      }`;
    }
    return `grid h-8 w-8 place-items-center rounded-lg ring-1 transition ${
      copied
        ? 'bg-green/10 text-green ring-green/25'
        : 'bg-primary/30 text-body-300/70 ring-border/45 hover:bg-primary/50 hover:text-body'
    }`;
  })();

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={className}
      aria-label={copied ? `${label} copied` : `Copy ${label}`}
      title={copied ? 'Copied!' : `Copy ${label}`}
    >
      {copied ? (
        <CheckIcon className={iconClassName} />
      ) : (
        <CopyIcon className={iconClassName} />
      )}
    </button>
  );
};

export default CopyButton;
