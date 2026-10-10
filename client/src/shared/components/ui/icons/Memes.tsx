import type { IconProps } from '@/shared/types/icon';

/**
 * The memes laugh — for the Memes destination. Stroke `currentColor` so it
 * tints with the nav active state (the older Emoji/Images assets carry
 * hardcoded fills and cannot).
 */
const MemesIcon = ({ className, ...props }: IconProps) => (
  <svg
    {...props}
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="8.5" />
    <path d="M8.6 10c.5.6 1.4.9 2.3.9" />
    <path d="M13.1 10.9c.9 0 1.8-.3 2.3-.9" />
    <path d="M7.8 13.2c1 2.6 2.6 4 4.2 4s3.2-1.4 4.2-4" />
  </svg>
);

export default MemesIcon;
