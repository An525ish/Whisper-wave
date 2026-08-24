import type { IconProps } from '@/types';

const CheckStrokeIcon = ({ className, ...props }: IconProps) => (
  <svg
    {...props}
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
  >
    <path
      d="M20 6 9 17l-5-5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CheckStrokeIcon;
