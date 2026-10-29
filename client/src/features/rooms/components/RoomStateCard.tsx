import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { ROOM_END_COPY } from '../constants';
import type { RoomEndState } from '../types';
import RoomBackdrop from './RoomBackdrop';
import './roomsStates.css';

type Props = {
  state: RoomEndState;
  /** Offered after a server restart: re-seat with the stored persona. */
  onRejoin?: () => void;
};

const LOCK = (
  <>
    <rect x="6" y="11" width="12" height="9" rx="2" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9 11V8a3 3 0 0 1 6 0v3" stroke="currentColor" strokeWidth="1.8" />
  </>
);
const MOON = (
  <path d="M20 13.5A8 8 0 0 1 10.5 4 8 8 0 1 0 20 13.5z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
);
const ALERT = (
  <>
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
    <path d="M12 8v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="12" cy="16.5" r="1.1" fill="currentColor" />
  </>
);

const ICONS = {
  kicked: LOCK,
  banned: LOCK,
  closed: MOON,
  switched_off: MOON,
  not_found: ALERT,
  restarted: ALERT,
  identity_required: ALERT,
};

/**
 * One full-page ending for the whole visit: removed, banned, closed, room not
 * found, rooms switched off, server restarted. Always a way out.
 */
const RoomStateCard = ({ state, onRejoin }: Props) => {
  const copy = ROOM_END_COPY[state.kind];
  const toHome = state.kind === 'switched_off';

  return (
    <div className="rm-statepage">
      <RoomBackdrop />
      <div className="rm-statecard" role="status">
        <span aria-hidden className="rm-statecard__orb">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            {ICONS[state.kind]}
          </svg>
        </span>
        <h1 className="rm-statecard__title">{copy.title}</h1>
        <p className="rm-statecard__sub">{state.detail || copy.sub}</p>
        {onRejoin && state.kind === 'restarted' && (
          <button type="button" onClick={onRejoin} className="rm-statecard__btn">
            Rejoin
          </button>
        )}
        <Link
          to={toHome ? ROUTES.home : ROUTES.rooms}
          className={state.kind === 'restarted' ? 'rm-statecard__link' : 'rm-statecard__btn'}
        >
          {toHome ? 'Back home' : 'Back to lobby'}
        </Link>
      </div>
    </div>
  );
};

export default RoomStateCard;
