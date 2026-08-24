import type { IconProps } from '@/types';

const MailIcon = ({ className, ...props }: IconProps) => (
  <svg
    {...props}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
  >
    <path
      d="M4 7.5h16a1.5 1.5 0 0 1 1.5 1.5v8a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 17V9A1.5 1.5 0 0 1 4 7.5Z"
      stroke="currentColor"
      strokeWidth="1.5"
    />
    <path
      d="m4 8 8 5.5L20 8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default MailIcon;
