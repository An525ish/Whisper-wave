import { hoursSummary } from '../utils/hours';
import type { RoomInfo } from '../types';

type Props = {
  room: RoomInfo;
  /** Lobby clock (ms) for the hours label in the room's own timezone. */
  now: number;
};

const MAX_FACES = 8;

/**
 * The room's text banner: official or community, hours, a big title, what it is
 * about, and who is already inside. The art sits beside it in `RoomDoorScene`.
 */
const RoomDoorHero = ({ room, now }: Props) => {
  const faces = Math.min(room.totalOnline, MAX_FACES);

  return (
    <header className="rmq-hero">
      <div className="rmq-pills">
        <span className="rm-officialpill">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M12 2l2.4 4.9 5.6.8-4 4 1 5.6-5-2.6-5 2.6 1-5.6-4-4 5.6-.8L12 2z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
          </svg>
          {room.official ? 'Official room' : 'Community room'}
        </span>
        <span className="rmq-chip">{hoursSummary(room.hours, now)}</span>
        <span className="rmq-chip">{room.lang}</span>
      </div>

      <h1 className="rmq-title">{room.title}</h1>
      <p className="rmq-desc">{room.description}</p>

      {room.totalOnline > 0 ? (
        <div className="rmq-crowd">
          <span className="rmq-faces" aria-hidden>
            {Array.from({ length: faces }, (_, i) => (
              <span key={i} className="rmq-face">?</span>
            ))}
          </span>
          <p>
            {room.totalOnline} {room.totalOnline === 1 ? 'person' : 'people'} inside right now
          </p>
        </div>
      ) : (
        <p className="rmq-quiet">Nobody inside yet. Be the first.</p>
      )}
    </header>
  );
};

export default RoomDoorHero;
