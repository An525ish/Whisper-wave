import type { IconProps } from '@/shared/types';

const ForwardIcon = ({ ...props }: IconProps) => (
  <svg
    {...props}
    viewBox="0 0 122.88 80.98"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M100.66,40.49L60.58,80.98V60.81C35.23,55.56,15.21,61.35,0,80.63c2.64-39.65,29.73-58.78,60.58-60.05V0 L100.66,40.49L100.66,40.49z M122.88,40.49L82.79,80.98V68.04l27.28-27.55L82.79,12.94V0L122.88,40.49L122.88,40.49z"
    />
  </svg>
);

export default ForwardIcon;
