import type { ReactNode } from 'react';

/** The 18px stroked glyph every message-menu row uses. */
export const menuIcon = (path: ReactNode): ReactNode => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {path}
  </svg>
);
