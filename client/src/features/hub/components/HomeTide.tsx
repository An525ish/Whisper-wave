import { Link } from 'react-router-dom';
import { ROUTES } from '@/shared/constants/routes';
import { useAuthStore } from '@/features/auth';
import { useRoomsList } from '@/features/rooms';
import { formatHour, nowMinutesIn, tzShort } from '../utils/tide';

const ART_VARIANTS = 4;

const hoursLabel = (hours: { start: string; end: string; days: number[]; tz: string }): string => {
  const span = `${formatHour(hours.start)}–${formatHour(hours.end)}`;
  if (hours.days.length === 7) return `Nightly ${span}`;
  return `${span} ${tzShort(hours.tz)}`;
};

/**
 * Tonight on the wave: every room as an inviting card — art tile, title,
 * what it's about, a status pill and its hours. No numbers are invented —
 * windows come from room hours, occupancy from the lobby query, time from
 * the clock. Rows are links; the art is decoration for text that says it.
 */
const HomeTide = () => {
  const user = useAuthStore((s) => s.user);
  const { data: rooms } = useRoomsList();
  const nowMin = nowMinutesIn('Asia/Kolkata');

  if (!rooms) return null;

  // No water yet: an invitation, not a void. Members can open the first
  // room; guests get the funnel that actually works for them.
  if (rooms.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 px-5 py-10 text-center">
        <span aria-hidden className="hw-live-dot mx-auto block h-2 w-2 rounded-full bg-green" />
        <p className="mt-3 font-display text-2xl text-white">Still water.</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-body-300">
          No rooms exist yet. The first ripple could be yours.
        </p>
        {user ? (
          <Link
            to={ROUTES.newRoom}
            className="hw-sheen mt-5 inline-block rounded-full bg-gradient-action-button-green px-6 py-2.5 text-sm font-medium text-body transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
          >
            + Create the first room
          </Link>
        ) : (
          <Link
            to={ROUTES.whisper}
            className="mt-5 inline-block rounded-full border border-green/40 px-6 py-2.5 text-sm font-medium text-green transition hover:bg-green/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green"
          >
            Find someone instead →
          </Link>
        )}
      </div>
    );
  }

  const openCount = rooms.filter((room) => room.open).length;
  const onlineCount = rooms.reduce((sum, room) => sum + (room.open ? room.totalOnline : 0), 0);
  const timeLabel = formatHour(
    `${String(Math.floor(nowMin / 60)).padStart(2, '0')}:${String(nowMin % 60).padStart(2, '0')}`
  );

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3 px-1">
        <div>
          <p className="hw-hud flex items-center gap-2 text-body-300">
            <span
              aria-hidden
              className={`h-1.5 w-1.5 rounded-full ${onlineCount > 0 ? 'bg-green hw-live-dot' : 'bg-white/30'}`}
            />
            tonight · {timeLabel} IST
          </p>
          <p className="mt-1.5 text-sm text-body-300" aria-live="off">
            {openCount === 0 ? (
              'All rooms are closed right now — check back later.'
            ) : (
              <>
                <span className="font-semibold text-white">
                  {openCount} {openCount === 1 ? 'room open' : 'rooms open'}
                </span>
                {' · '}
                {onlineCount > 0 ? (
                  <span className="font-semibold text-green">
                    {onlineCount} {onlineCount === 1 ? 'person inside' : 'people inside'}
                  </span>
                ) : (
                  'quiet for now'
                )}
              </>
            )}
          </p>
        </div>
        <Link
          to={ROUTES.rooms}
          className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm font-medium text-green transition hover:border-green/40 hover:bg-green/10 focus-visible:outline-2 focus-visible:outline-green"
        >
          See all →
        </Link>
      </div>

      <ul className="flex flex-col gap-2.5" aria-label="Rooms open tonight">
        {rooms.map((room, index) => {
          const live = room.open && room.totalOnline > 0;
          const status = !room.open
            ? `Opens ${room.hours ? formatHour(room.hours.start) : 'later'}`
            : live
              ? `${room.totalOnline} inside`
              : 'Quiet now';
          const label = `${room.title}, ${status}, ${room.description}${
            room.hours
              ? `, open ${formatHour(room.hours.start)} to ${formatHour(room.hours.end)} ${tzShort(room.hours.tz)}`
              : ', always open'
          }`;
          const initial = (room.title.trim().charAt(0) || '?').toUpperCase();
          return (
            <li key={room.slug}>
              <Link
                to={ROUTES.room(room.slug)}
                aria-label={label}
                className={`hw-roomcard hw-rise group${live ? ' hw-roomcard--live' : ''}${room.open ? '' : ' hw-roomcard--closed'}`}
                style={{ '--hw-d': `${index * 70}ms` } as React.CSSProperties}
              >
                <span
                  aria-hidden
                  className={`hw-roomart hw-roomart--${index % ART_VARIANTS}`}
                >
                  {initial}
                  {live && <span className="hw-roomart__pulse" />}
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
                      <span className="hw-roomstatus hw-roomstatus--live">
                        <span aria-hidden className="hw-roomstatus__dot" />
                        {room.totalOnline} inside
                      </span>
                    ) : room.open ? (
                      <span className="hw-roomstatus">
                        <span aria-hidden className="hw-roomstatus__dot" />
                        Quiet now
                      </span>
                    ) : (
                      <span className="hw-roomstatus hw-roomstatus--closed">{status}</span>
                    )}
                    {room.hours && (
                      <span className="hw-roomhours">{hoursLabel(room.hours)}</span>
                    )}
                  </span>
                </span>
                <span aria-hidden className="hw-roomcard__arrow">
                  →
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {user && (
        <p className="mt-3 text-center">
          <Link
            to={ROUTES.newRoom}
            className="text-sm font-medium text-body-300 transition hover:text-green focus-visible:outline-2 focus-visible:outline-green"
          >
            + Start your own room
          </Link>
        </p>
      )}
    </div>
  );
};

export default HomeTide;
