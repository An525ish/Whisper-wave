import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import type { RoomSummary } from '../types';
import './rooms.css';

type Props = {
  room: RoomSummary;
  /** Stagger index within the visible list — entrance delay only. */
  index?: number;
};

/** Stable art variant per room — reorders never recolor. */
const artVariant = (slug: string): number => {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  return hash % 4;
};

const formatHour = (hhmm: string): string => {
  const [h, m] = hhmm.split(':').map(Number);
  const h24 = (h || 0) % 24;
  const suffix = h24 < 12 ? 'am' : 'pm';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return (m || 0) === 0 ? `${h12}${suffix}` : `${h12}:${String(m).padStart(2, '0')}${suffix}`;
};

const hoursLabel = (hours: NonNullable<RoomSummary['hours']>): string => {
  const span = `${formatHour(hours.start)}–${formatHour(hours.end)}`;
  if (hours.days.length === 7) return `Nightly ${span}`;
  return `${span} ${hours.tz.split('/').pop() ?? hours.tz}`;
};

/**
 * One lobby row as an inviting card: art tile, title, what it's about, a
 * status pill and its hours. Decorative art for text that already says it —
 * the link's accessible name carries the whole story.
 */
const RoomLobbyCard = ({ room, index = 0 }: Props) => {
  const live = room.open && room.totalOnline > 0;
  const status = !room.open
    ? `Opens ${room.hours ? formatHour(room.hours.start) : 'later'}`
    : live
      ? `${room.totalOnline} inside`
      : 'Quiet now';
  const label = `${room.title}, ${status}, ${room.description}${
    room.hours
      ? `, open ${formatHour(room.hours.start)} to ${formatHour(room.hours.end)}`
      : ', always open'
  }`;
  const initial = (room.title.trim().charAt(0) || '?').toUpperCase();

  return (
    <Link
      to={ROUTES.room(room.slug)}
      aria-label={label}
      className={`rm-roomcard rm-rise group${live ? ' rm-roomcard--live' : ''}${room.open ? '' : ' rm-roomcard--closed'}`}
      style={{ '--rm-d': `${(index % 8) * 60}ms` } as React.CSSProperties}
    >
      <span aria-hidden className={`rm-roomart rm-roomart--${artVariant(room.slug)}`}>
        {initial}
        {live && <span className="rm-roomart__pulse" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold text-white">
          {room.title}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-body-300">
          {room.description}
        </span>
        <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {live ? (
            <span className="rm-roomstatus rm-roomstatus--live">
              <span aria-hidden className="rm-roomstatus__dot" />
              {room.totalOnline} inside
            </span>
          ) : room.open ? (
            <span className="rm-roomstatus">
              <span aria-hidden className="rm-roomstatus__dot" />
              Quiet now
            </span>
          ) : (
            <span className="rm-roomstatus rm-roomstatus--closed">{status}</span>
          )}
          {room.hours && <span className="rm-roomhours">{hoursLabel(room.hours)}</span>}
        </span>
      </span>
      <span aria-hidden className="rm-roomcard__arrow">
        →
      </span>
    </Link>
  );
};

export default RoomLobbyCard;
