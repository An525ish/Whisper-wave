import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { initialOf, roomArtVariant } from '../utils/art';
import { ROOM_LISTENING_COPY } from '../constants';
import { hoursSummary, nextOpensLabel } from '../utils/hours';
import type { RoomSummary } from '../types';
import './RoomLobbyCard.css';

type Props = {
  room: RoomSummary;
  /** Stagger index within the visible list — entrance delay only. */
  index?: number;
  /** Lobby clock (ms) for open/closed labels in the room's own timezone. */
  now: number;
};

/**
 * One lobby row as an inviting card: art tile, title, what it's about, a
 * status pill and its hours. Decorative art for text that already says it —
 * the link's accessible name carries the whole story. Closed rooms say when
 * they open, with day and timezone, never a fake "0 online".
 */
const RoomLobbyCard = ({ room, index = 0, now }: Props) => {
  const closed = room.status === 'closed';
  const waiting = room.status === 'waiting_mod';
  const live = room.status === 'open' && room.totalOnline > 0;
  const hours = hoursSummary(room.hours, now);
  const status = closed
    ? nextOpensLabel(room.hours, now)
    : waiting
      ? ROOM_LISTENING_COPY.lobbyLabel
      : live
        ? `${room.totalOnline} inside`
        : 'Quiet now';
  const label = `${room.title}, ${status}, ${room.description}, ${room.hours ? `open ${hours}` : 'always open'}`;

  return (
    <Link
      to={ROUTES.room(room.slug)}
      aria-label={label}
      className={`rm-roomcard rm-rise group${live ? ' rm-roomcard--live' : ''}${closed ? ' rm-roomcard--closed' : ''}`}
      style={{ '--rm-d': `${(index % 8) * 60}ms` } as CSSProperties}
    >
      <span aria-hidden className={`rm-roomart rm-roomart--${roomArtVariant(room.slug)}`}>
        {initialOf(room.title)}
        {live && <span className="rm-roomart__pulse" />}
      </span>
      <span className="rm-roomcard__body min-w-0 flex-1">
        <span className="rm-roomcard__title block truncate font-semibold text-white">{room.title}</span>
        <span className="rm-roomcard__desc mt-0.5 block truncate text-body-300">{room.description}</span>
        <span className="rm-roomcard__tags flex flex-wrap items-center">
          {live ? (
            <span className="rm-roomstatus rm-roomstatus--live">
              <span aria-hidden className="rm-roomstatus__dot" />
              {room.totalOnline} inside
            </span>
          ) : waiting ? (
            <span className="rm-roomstatus rm-roomstatus--waiting">
              <span aria-hidden className="rm-roomstatus__dot" />
              {ROOM_LISTENING_COPY.lobbyLabel}
            </span>
          ) : !closed ? (
            <span className="rm-roomstatus">
              <span aria-hidden className="rm-roomstatus__dot" />
              Quiet now
            </span>
          ) : (
            <span className="rm-roomstatus rm-roomstatus--closed">{status}</span>
          )}
          {room.hours && <span className="rm-roomhours">{hours}</span>}
        </span>
      </span>
      <span aria-hidden className="rm-roomcard__go">{closed ? 'View' : 'Join'}</span>
    </Link>
  );
};

export default RoomLobbyCard;
