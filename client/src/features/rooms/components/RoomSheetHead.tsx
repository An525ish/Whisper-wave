import type { ReactNode } from 'react';
import './rooms.css';

type Props = {
  icon: ReactNode;
  /** red | green tint for the orb, default violet. */
  tone?: 'violet' | 'red' | 'green';
  eyebrow: string;
  title: string;
  /** id naming the dialog title for the sheet's `labelledBy`. */
  titleId: string;
};

/**
 * Shared sheet header: icon orb, mono eyebrow, display title. One look for
 * report, invites and settings — the sheets differ below the fold only.
 */
const RoomSheetHead = ({ icon, tone = 'violet', eyebrow, title, titleId }: Props) => (
  <div className="rm-sheethead">
    <span
      aria-hidden
      className={`rm-sheethead__orb${tone === 'red' ? ' rm-sheethead__orb--red' : ''}${tone === 'green' ? ' rm-sheethead__orb--green' : ''}`}
    >
      {icon}
    </span>
    <div>
      <p className="rm-sheethead__eyebrow">{eyebrow}</p>
      <h2 id={titleId} className="rm-sheethead__title">
        {title}
      </h2>
    </div>
  </div>
);

export default RoomSheetHead;
