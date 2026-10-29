import type { IconProps } from '@/shared/types/icon';

/** Controller, for the Games destination. Stroke `currentColor` so it tints with the nav state. */
const GamepadIcon = ({ className, ...props }: IconProps) => (
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
    <path d="M7.5 6.5h9a4.5 4.5 0 0 1 4.4 3.6l.9 4.4a2.8 2.8 0 0 1-4.7 2.5L14.6 15H9.4l-2.5 2a2.8 2.8 0 0 1-4.7-2.5l.9-4.4a4.5 4.5 0 0 1 4.4-3.6Z" />
    <path d="M8 9.5v3M6.5 11h3" />
    <circle cx="15.5" cy="10.3" r=".6" fill="currentColor" />
    <circle cx="17.5" cy="12" r=".6" fill="currentColor" />
  </svg>
);

export default GamepadIcon;
