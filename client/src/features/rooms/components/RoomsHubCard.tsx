import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { publicHeadcount } from '@/shared/utils/format';
import { formatHour, tzShort } from '@/shared/utils/hours';
import { useAuthStore } from '@/features/auth';
import { useRoomsList } from '../hooks/useRoomsQueries';
import { isJoinable } from '../utils/roomStatus';

type Props = {
  /** The Rooms flag. Off means no panel at all, so dark surfaces stay invisible. */
  enabled: boolean;
  onClick: () => void;
};

const MAX_LISTED = 4;
const ART_VARIANTS = 4;

const hoursLabel = (hours: { start: string; end: string; days: number[]; tz: string }): string => {
  const span = `${formatHour(hours.start)}-${formatHour(hours.end)}`;
  return hours.days.length === 7 ? `Nightly ${span}` : `${span} ${tzShort(hours.tz)}`;
};

/**
 * Rooms' showcase section on the hub home. Owned here (HUB_PLAN §7.1); the hub only
 * composes it. Lists the real rooms, open ones first, each linking straight in.
 * Headcounts appear only above the public threshold, so a quiet room never
 * announces "1 person". Its `hw-show*` / `hw-roomcard*` look comes from the
 * hub home's explore styles.
 */
const RoomsHubCard = ({ enabled, onClick }: Props) => {
  const user = useAuthStore((s) => s.user);
  const { data: rooms } = useRoomsList(enabled);
  if (!enabled || !rooms) return null;

  const headcount = publicHeadcount(
    rooms.reduce((sum, room) => sum + (isJoinable(room) ? room.totalOnline : 0), 0)
  );
  const listed = [...rooms]
    .sort((a, b) => Number(isJoinable(b)) - Number(isJoinable(a)))
    .slice(0, MAX_LISTED);

  return (
    <section aria-label="Rooms" className="hw-show hw-show--rooms">
      <div aria-hidden className="hw-show__ghost">Rooms</div>
      <div className="hw-show__copy">
        <p className="hw-show__eyebrow">
          <span className="hw-show__num">01</span>
          <span aria-hidden className="hw-show__dot" />
          {headcount !== null ? `${headcount} people inside` : 'Group chats'}
        </p>
        <h2 className="hw-show__title">
          Walk into a <span className="hw-iri italic">room.</span>
        </h2>
        <p className="hw-show__desc">
          Small groups around one topic. Chat isn&apos;t saved. Join in, or just listen first.
        </p>
        <Link to={ROUTES.rooms} onClick={onClick} className="hw-show__go">
          See all rooms
        </Link>
      </div>

      <div className="hw-show__art">
      {listed.length > 0 ? (
        <ul className="hw-roomlist">
          {listed.map((room, index) => {
            const open = isJoinable(room);
            const count = publicHeadcount(room.totalOnline);
            const live = open && count !== null;
            return (
              <li key={room.slug}>
                <Link
                  to={ROUTES.room(room.slug)}
                  onClick={onClick}
                  className={`hw-roomcard group${live ? ' hw-roomcard--live' : ''}${open ? '' : ' hw-roomcard--closed'}`}
                >
                  <span aria-hidden className={`hw-roomart hw-roomart--${index % ART_VARIANTS}`}>
                    {room.title.trim().charAt(0).toUpperCase() || '?'}
                    {live && <span className="hw-roomart__pulse" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-semibold text-white">{room.title}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-body-300">{room.description}</span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {live ? (
                        <span className="hw-roomstatus hw-roomstatus--live">
                          <span aria-hidden className="hw-roomstatus__dot" />
                          {count} inside
                        </span>
                      ) : open ? (
                        <span className="hw-roomstatus">
                          <span aria-hidden className="hw-roomstatus__dot" />
                          Quiet now
                        </span>
                      ) : (
                        <span className="hw-roomstatus hw-roomstatus--closed">
                          {room.hours ? `Opens ${formatHour(room.hours.start)}` : 'Closed'}
                        </span>
                      )}
                      {room.hours && <span className="hw-roomhours">{hoursLabel(room.hours)}</span>}
                    </span>
                  </span>
                  <span aria-hidden className="hw-roomcard__arrow">→</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="hw-roomempty">
          <p>No rooms yet.</p>
          <Link
            to={user ? ROUTES.newRoom : ROUTES.whisper}
            onClick={onClick}
            className="hw-show__go"
          >
            {user ? 'Create a room' : 'Find someone instead'}
          </Link>
        </div>
      )}

      </div>
    </section>
  );
};

export default RoomsHubCard;
