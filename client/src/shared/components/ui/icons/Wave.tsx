import type { IconProps } from '@/shared/types';

/** The brand "wave" — three ripples, used for the anonymous-chat destination. */
const WaveIcon = ({ className, ...props }: IconProps) => (
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
    <path d="M2.5 9c2.2-3 4.3-3 6.5 0s4.3 3 6.5 0 4.3-3 6.5 0" />
    <path d="M2.5 15c2.2-3 4.3-3 6.5 0s4.3 3 6.5 0 4.3-3 6.5 0" />
  </svg>
);

export default WaveIcon;
