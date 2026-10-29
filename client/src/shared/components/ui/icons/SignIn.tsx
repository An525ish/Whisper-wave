import type { IconProps } from '@/shared/types';

const SignInIcon = ({ className, ...props }: IconProps) => (
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
    <path d="M14 4.5h4a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5h-4" />
    <path d="M10 8.5 14 12l-4 3.5" />
    <path d="M14 12H4" />
  </svg>
);

export default SignInIcon;
