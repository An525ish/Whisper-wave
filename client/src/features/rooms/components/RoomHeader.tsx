import ChevronLeft from '@/shared/components/ui/icons/ChevronLeft';
import DotsMenu from '@/shared/components/ui/DotsMenu';
import { ROOM_SLOW_MODE_MS } from '../constants';
import { initialOf, roomArtVariant } from '../utils/art';
import type { RoomModAction, RoomYou } from '../types';
import './roomHeader.css';

type Props = {
  slug: string;
  title: string;
  online: number;
  you: RoomYou | null;
  connected: boolean;
  infoOpen: boolean;
  onToggleInfo: () => void;
  onLeave: () => void;
  onMod: (action: RoomModAction) => void;
  onOpenInvites: () => void;
  onOpenSettings: () => void;
};

/**
 * Floating thread header: way back, art tile with live dot, title + status
 * line, the mod menu (mods and hosts) and the info button (sheet only; the rail shows it).
 */
const RoomHeader = ({
  slug,
  title,
  online,
  you,
  connected,
  infoOpen,
  onToggleInfo,
  onLeave,
  onMod,
  onOpenInvites,
  onOpenSettings,
}: Props) => {
  const canModerate = you !== null && you.role !== 'member';

  return (
    <div className="rm-cheadfloat">
      <header className="rm-chead">
        <button type="button" onClick={onLeave} aria-label="Leave room" title="Leave room" className="rm-hbtn">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="rm-chead__identity">
          <span aria-hidden className={`rm-chead__art rm-chead__art--${roomArtVariant(slug)}`}>
            <span>{initialOf(title || slug)}</span>
            <span className={`rm-chead__dot${connected ? '' : ' rm-chead__dot--warn'}`} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="rm-chead__title">
              <span className="rm-chead__name">{title || slug}</span>
              <span className="rm-livepill">live</span>
            </div>
            {connected ? (
              <p className="rm-chead__status">
                {online} {online === 1 ? 'soul' : 'souls'} in here{you ? ` · you’re ${you.alias}` : ''}
              </p>
            ) : (
              <p className="rm-chead__status rm-chead__status--warn" role="status">
                Reconnecting…
              </p>
            )}
          </div>
        </div>
        {canModerate && (
          <DotsMenu
            ariaLabel="Moderate room"
            align="right"
            items={[
              { id: 'invites', label: 'Invite links', onSelect: onOpenInvites },
              ...(you?.role === 'host' ? [{ id: 'settings', label: 'Room settings', onSelect: onOpenSettings }] : []),
              { id: 'lock', label: 'Lock room', onSelect: () => onMod({ action: 'lock' }) },
              { id: 'unlock', label: 'Unlock room', onSelect: () => onMod({ action: 'unlock' }) },
              { id: 'slow-on', label: `Slow mode ${ROOM_SLOW_MODE_MS / 1000}s`, onSelect: () => onMod({ action: 'slow', ms: ROOM_SLOW_MODE_MS }) },
              { id: 'slow-off', label: 'Slow mode off', onSelect: () => onMod({ action: 'slow', ms: 0 }) },
            ]}
          />
        )}
        <button
          type="button"
          onClick={onToggleInfo}
          aria-expanded={infoOpen}
          aria-label="Room info"
          title="Room info"
          className={`rm-hbtn rm-hbtn--sheetonly${infoOpen ? ' rm-hbtn--active' : ''}`}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
            <path d="M12 11v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="7.8" r="1.1" fill="currentColor" />
          </svg>
        </button>
      </header>
    </div>
  );
};

export default RoomHeader;
