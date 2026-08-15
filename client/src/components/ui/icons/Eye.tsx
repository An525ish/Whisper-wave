import type { IconProps } from '@/types';

type EyeIconProps = IconProps & {
  open?: boolean;
};

const EyeIcon = ({ open = false, ...props }: EyeIconProps) =>
  open ? (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="3"
        stroke="currentColor"
        strokeWidth="1.75"
      />
    </svg>
  ) : (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 3l18 18M9.9 9.9A3 3 0 0 0 14.1 14.1M6.1 6.3C4 7.8 2.5 10.2 2 12c0 0 3.5 7 10 7 1.9 0 3.6-.5 5.1-1.3M10.6 5.2A10.4 10.4 0 0 1 12 5c6.5 0 10 7 10 7a16.5 16.5 0 0 1-2.2 3.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

export default EyeIcon;
