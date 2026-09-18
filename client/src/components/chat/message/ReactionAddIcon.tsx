import type { IconProps } from '@/types';

/** Smiley with a small + on the top-right arc — reads as one icon. */
const ReactionAddIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
    <circle cx="11" cy="12.5" r="6.25" stroke="currentColor" strokeWidth="1.45" />
    <circle cx="9.35" cy="11.1" r="0.6" fill="currentColor" />
    <circle cx="12.65" cy="11.1" r="0.6" fill="currentColor" />
    <path
      d="M9 13.75c.55.7 1.15 1.05 2 1.05s1.45-.35 2-1.05"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path d="M16.2 6.2v3.2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    <path d="M14.6 7.8h3.2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

export default ReactionAddIcon;
