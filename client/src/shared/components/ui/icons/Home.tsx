import type { IconProps } from '@/shared/types';

const HomeIcon = ({ className, ...props }: IconProps) => (
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
    <path d="M3.5 10.8 12 3.5l8.5 7.3V20a.5.5 0 0 1-.5.5h-4.5v-5.8h-7v5.8H4a.5.5 0 0 1-.5-.5v-9.2Z" />
  </svg>
);

export default HomeIcon;
