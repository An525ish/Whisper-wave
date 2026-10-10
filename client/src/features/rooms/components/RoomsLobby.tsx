import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { track } from '@/shared/lib/analytics';
import { ROUTES } from '@/shared/constants/routes';
import { useAuthStore } from '@/features/auth';
import { ROOM_EVENTS } from '../constants';
import { useRoomsList } from '../hooks/useRoomsQueries';
import RoomLobbyCard from './RoomLobbyCard';
import './rooms.css';

type Filter = 'all' | 'open' | 'live' | 'later';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All rooms' },
  { id: 'open', label: 'Open now' },
  { id: 'live', label: 'With people' },
  { id: 'later', label: 'Opening later' },
];

/** Bokeh crowd behind the lobby — violet/teal/green fireflies, slow rise. */
const CROWD: Array<{ left: string; size: string; dur: string; delay: string; tone: string }> = [
  { left: '4%', size: '22px', dur: '24s', delay: '0s', tone: 'rm-mote--v' },
  { left: '12%', size: '12px', dur: '18s', delay: '-6s', tone: 'rm-mote--t' },
  { left: '21%', size: '16px', dur: '21s', delay: '-12s', tone: 'rm-mote--g' },
  { left: '30%', size: '10px', dur: '17s', delay: '-3s', tone: 'rm-mote--v' },
  { left: '39%', size: '26px', dur: '27s', delay: '-9s', tone: 'rm-mote--t' },
  { left: '47%', size: '13px', dur: '19s', delay: '-15s', tone: 'rm-mote--g' },
  { left: '55%', size: '18px', dur: '23s', delay: '-7s', tone: 'rm-mote--v' },
  { left: '63%', size: '11px', dur: '16s', delay: '-11s', tone: 'rm-mote--t' },
  { left: '71%', size: '24px', dur: '25s', delay: '-4s', tone: 'rm-mote--g' },
  { left: '79%', size: '14px', dur: '20s', delay: '-14s', tone: 'rm-mote--v' },
  { left: '87%', size: '19px', dur: '22s', delay: '-8s', tone: 'rm-mote--t' },
  { left: '94%', size: '12px', dur: '18s', delay: '-2s', tone: 'rm-mote--g' },
];

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
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const trackedRef = useRef(false);

  useEffect(() => {
    if (trackedRef.current || !rooms) return;
    trackedRef.current = true;
    track(ROOM_EVENTS.LOBBY_VIEW, { count: rooms.length });
  }, [rooms]);

  const counts = useMemo(() => {
    const list = rooms ?? [];
    return {
      all: list.length,
      open: list.filter((r) => r.open).length,
      live: list.filter((r) => r.open && r.totalOnline > 0).length,
      later: list.filter((r) => !r.open).length,
      people: list.reduce((sum, r) => sum + (r.open ? r.totalOnline : 0), 0),
    };
  }, [rooms]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = (rooms ?? []).filter((room) => {
      if (filter === 'open' && !room.open) return false;
      if (filter === 'live' && !(room.open && room.totalOnline > 0)) return false;
      if (filter === 'later' && room.open) return false;
      if (q && !`${room.title} ${room.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      const aLive = a.open && a.totalOnline > 0;
      const bLive = b.open && b.totalOnline > 0;
      if (aLive !== bLive) return aLive ? -1 : 1;
      if (a.open !== b.open) return a.open ? -1 : 1;
      if (aLive && bLive) return b.totalOnline - a.totalOnline;
      return a.title.localeCompare(b.title);
    });
  }, [rooms, query, filter]);

  return (
    <div className="rm-page">
      <div aria-hidden className="rm-bg">
        <div className="rm-mesh" />
        <div className="rm-glow rm-glow--violet" />
        <div className="rm-glow rm-glow--teal" />
        <div className="rm-crowd">
          {CROWD.map((mote, i) => (
            <span
              key={i}
              className={`rm-mote ${mote.tone}`}
              style={
                {
                  '--rm-x': mote.left,
                  '--rm-size': mote.size,
                  '--rm-dur': mote.dur,
                  '--rm-delay': mote.delay,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
        <div className="rm-grain" />
        <div className="rm-vignette" />
      </div>

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
          {FILTERS.map((chip) => (
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
            {visible.map((room, index) => (
              <li key={room.slug}>
                <RoomLobbyCard room={room} index={index} />
              </li>
            ))}
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
