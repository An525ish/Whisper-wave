import type { IconProps } from '@/types';

const ExternalLinkIcon = ({ className, ...props }: IconProps) => (
  <svg
    {...props}
    className={className ?? 'h-4 w-4'}
    viewBox="0 0 20 20"
    fill="none"
    aria-hidden
  >
    <path
      d="M11 3h6v6M17 3l-8 8M7 5H4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1v-3"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ExternalLinkIcon;
