import { avatarGradient } from '../utils/vibeTag';
import './anonPartnerPanel.css';

type Props = {
  name: string;
  /** One quiet line under the name: presence, or what this panel is. */
  status: string;
  /** Presence is live — tints the status line green. */
  live?: boolean;
  /** `column` overlaps the panel's top edge like the main app; `sheet` sits inline. */
  variant: 'column' | 'sheet';
};

/**
 * The top of both profile panels: avatar, name, one status line.
 *
 * The same shape as the logged-in app's `ProfilePanel`: a large round avatar that
 * straddles the panel's top edge (inline, smaller, in the sheet), then the name in
 * medium weight and one muted line. The avatar is a gradient + initial, since an
 * anonymous person has no photo.
 */
export default function AnonProfileHead({ name, status, live = false, variant }: Props) {
  return (
    <div className={`aph aph--${variant}`}>
      <div className="aph__avatar" style={{ background: avatarGradient(name) }} aria-hidden>
        {name.trim().charAt(0).toUpperCase() || '?'}
      </div>
      <h2 className="aph__name">{name}</h2>
      <p className={`aph__status${live ? ' aph__status--live' : ''}`}>{status}</p>
    </div>
  );
}
