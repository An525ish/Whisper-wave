import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { track } from '@/shared/lib/analytics';
import { ROUTES } from '@/shared/constants/routes';
import { useAuthStore } from '@/features/auth';
import AmbientBackdrop from '@/shared/components/ui/backdrop/AmbientBackdrop';
import { useNowWhile } from '@/shared/hooks/useNowWhile';
import { ROOM_CROWD, ROOM_EVENTS, ROOM_FILTERS, ROOM_LOBBY_CLOCK_MS } from '../constants';
import { useRoomReminderControls } from '../hooks/useRoomReminderControls';
import { useRoomsList } from '../hooks/useRoomsQueries';
import type { RoomsFilter } from '../types';
import MyRoomsSection from './MyRoomsSection';
import RoomLobbyCard from './RoomLobbyCard';
import RoomReminderButton from './RoomReminderButton';
import { isJoinable } from '../utils/roomStatus';
import './roomsBackdrop.css';
import './roomsLobby.css';
import './roomsStates.css';
import './roomsFocus.css';

/**
 * Live rooms lobby: official rooms plus approved public ones, with honest
 * occupancy. Search narrows instantly, chips filter by state, and the list
 * sorts people-first — live rooms top, quiet open next, closed last.
 * Closed rooms show their hours, never a fake "0 online". Occupancy
 * re-polls quietly so the counts stay near-live while you browse.
 */
const RoomsLobby = () => {
  const user = useAuthStore((s) => s.user);
  const { data: rooms, isLoading, isError, isFetching, refetch } = useRoomsList();
  const reminderFor = useRoomReminderControls();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<RoomsFilter>('all');
  const trackedRef = useRef(false);
  const now = useNowWhile(true, ROOM_LOBBY_CLOCK_MS);

  useEffect(() => {
    if (trackedRef.current || !rooms) return;
    trackedRef.current = true;
    track(ROOM_EVENTS.LOBBY_VIEW, { count: rooms.length });
  }, [rooms]);

  const counts = useMemo(() => {
    const list = rooms ?? [];
    return {
      all: list.length,
      open: list.filter((r) => isJoinable(r)).length,
      live: list.filter((r) => isJoinable(r) && r.totalOnline > 0).length,
      later: list.filter((r) => !isJoinable(r)).length,
      people: list.reduce((sum, r) => sum + (isJoinable(r) ? r.totalOnline : 0), 0),
    };
  }, [rooms]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (rooms ?? []).filter((room) => {
      if (filter === 'open' && !isJoinable(room)) return false;
      if (filter === 'live' && !(isJoinable(room) && room.totalOnline > 0)) return false;
      if (filter === 'later' && isJoinable(room)) return false;
      if (q && !`${room.title} ${room.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const aLive = isJoinable(a) && a.totalOnline > 0;
      const bLive = isJoinable(b) && b.totalOnline > 0;
      if (aLive !== bLive) return aLive ? -1 : 1;
      if (isJoinable(a) !== isJoinable(b)) return isJoinable(a) ? -1 : 1;
      if (aLive && bLive) return b.totalOnline - a.totalOnline;
      return a.title.localeCompare(b.title);
    });
  }, [rooms, query, filter]);

  return (
    <div className="rm-page">
      <AmbientBackdrop className="rm-bg" green={false}>
        <div className="rm-crowd">
          {ROOM_CROWD.map((mote, i) => (
            <span
              key={i}
              className={`rm-mote ${mote.tone}`}
              style={
                {
                  '--rm-x': mote.left,
                  '--rm-size': mote.size,
                  '--rm-dur': mote.dur,
                  '--rm-delay': mote.delay,
                } as CSSProperties
              }
            />
          ))}
        </div>
      </AmbientBackdrop>

      <main className="rm-wrap">
        <header>
          <p className="rm-eyebrow">
            <span aria-hidden className="rm-eyebrow__dot" />
            Live rooms
          </p>
          <h1 className="rm-title">
            Find your <span className="rm-iri">crowd.</span>
          </h1>
          <p className="rm-live" aria-live="off">
            {counts.open === 0 ? (
              'All rooms are closed right now — check back later.'
            ) : (
              <>
                <span className="font-semibold text-white">
                  {counts.open} {counts.open === 1 ? 'room open' : 'rooms open'}
                </span>
                {counts.people > 0 ? (
                  <>
                    {' · '}
                    <span className="font-semibold text-green">
                      {counts.people} {counts.people === 1 ? 'person inside' : 'people inside'}
                    </span>
                  </>
                ) : (
                  ' · quiet for now'
                )}
              </>
            )}
          </p>
        </header>

        {user && <MyRoomsSection />}

        <div className="rm-toolbar">
          <label className="rm-search">
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="sr-only">Search rooms</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics…"
              aria-label="Search rooms"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="rm-search__clear"
              >
                ×
              </button>
            )}
          </label>
          <button
            type="button"
            onClick={() => void refetch()}
            aria-label="Refresh rooms"
            title="Refresh"
            className={`rm-iconbtn${isFetching ? ' rm-iconbtn--spin' : ''}`}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M20 12a8 8 0 1 1-2.3-5.6 M20 3v4h-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {user && (
            <Link to={ROUTES.newRoom} className="rm-new">
              + New
            </Link>
          )}
        </div>

        <div role="group" aria-label="Filter rooms" className="rm-chips">
          {ROOM_FILTERS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              aria-pressed={filter === chip.id}
              className={`rm-chip${filter === chip.id ? ' rm-chip--active' : ''}`}
            >
              {chip.label}
              <span className="rm-chip__count">{counts[chip.id]}</span>
            </button>
          ))}
        </div>

        {isLoading && (
          <div aria-label="Loading rooms" className="flex flex-col gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="rm-skel" aria-hidden>
                <div className="rm-skel__art" />
                <div className="rm-skel__lines">
                  <div className="rm-skel__line" />
                  <div className="rm-skel__line rm-skel__line--short" />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="rm-empty">
            <p className="rm-empty__title">Couldn’t load rooms.</p>
            <p className="rm-empty__sub">Check your connection, then try again.</p>
            <button type="button" onClick={() => void refetch()} className="rm-empty__btn">
              Try again
            </button>
          </div>
        )}

        {rooms && rooms.length === 0 && (
          <div className="rm-empty">
            <p className="rm-empty__title">No rooms yet.</p>
            <p className="rm-empty__sub">The first ripple could be yours.</p>
            {user && (
              <Link to={ROUTES.newRoom} className="rm-empty__btn inline-block">
                + Create the first room
              </Link>
            )}
          </div>
        )}

        {visible.length > 0 && (
          <ul className="flex flex-col gap-3" aria-label="Rooms">
            {visible.map((room, index) => {
              const reminder = reminderFor(room);
              return (
                <li key={room.slug}>
                  <RoomLobbyCard room={room} index={index} now={now} />
                  {reminder && <RoomReminderButton title={room.title} control={reminder} />}
                </li>
              );
            })}
          </ul>
        )}

        {rooms && rooms.length > 0 && visible.length === 0 && (
          <div className="rm-empty">
            <p className="rm-empty__title">Nothing matches.</p>
            <p className="rm-empty__sub">
              {query ? `No rooms mention “${query.trim()}”.` : 'No rooms in this state right now.'}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setFilter('all');
              }}
              className="rm-empty__btn"
            >
              Clear search & filters
            </button>
          </div>
        )}

        {user ? (
          <p className="rm-create">
            <Link
              to={ROUTES.newRoom}
              className="text-sm font-medium text-body-300 transition hover:text-green focus-visible:outline-2 focus-visible:outline-green"
            >
              Can’t find your crowd? Start your own →
            </Link>
          </p>
        ) : (
          <div className="rm-guest">
            <p className="rm-guest__title">Guests can join every room.</p>
            <p className="rm-guest__sub">Make an account to start your own.</p>
            <Link to={ROUTES.authLogin} className="rm-guest__btn">
              Make an account
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default RoomsLobby;
