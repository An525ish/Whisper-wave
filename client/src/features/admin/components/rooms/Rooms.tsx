import { useState } from 'react';
import RefreshButton from '../shared/RefreshButton';
import { useRoomsPage } from '../../hooks/useRoomsPage';
import Bans from './Bans';
import PanicCard from './PanicCard';
import RoomCard from './RoomCard';
import RoomFilterChips from './RoomFilterChips';
import RoomEditPanel from './edit/RoomEditPanel';

/**
 * Room templates with live occupancy. Approving a user room for the lobby is
 * one visibility flip to `public` — unlisted rooms never appear publicly.
 * Private rooms are listed here too (reports, kill-switch, close) but are
 * never in the review queue and can't be approved.
 */
const RoomsAdmin = () => {
  const {
    rooms,
    visibleRooms,
    filter,
    setFilter,
    awaitingReview,
    isLoading,
    isError,
    refetch,
    saving,
    editingSlug,
    setEditingSlug,
    closingId,
    approve,
    saveRoom,
    closeInstance,
  } = useRoomsPage();
  const online = rooms?.reduce((sum, r) => sum + r.instances.reduce((n, i) => n + i.online, 0), 0) ?? 0;
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const shown = visibleRooms?.filter((r) => !q || r.title.toLowerCase().includes(q) || r.slug.includes(q));
  const editingRoom = rooms?.find((r) => r.slug === editingSlug);
  const openNow = rooms?.filter((r) => r.open).length ?? 0;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-blue">Console</p>
          <h1 className="mt-1 font-semibold text-3xl leading-none tracking-tight text-body sm:text-4xl">Rooms</h1>
          <p className="mt-2 text-sm text-body-300">Templates, live rooms, review queue, bans and kill switches</p>
        </div>
        <RefreshButton />
      </header>

      {rooms && (
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border/50 bg-border/40 sm:grid-cols-4">
          {[
            { label: 'Rooms', value: rooms.length, accent: 'text-body' },
            { label: 'People online', value: online, accent: online > 0 ? 'text-green' : 'text-body' },
            { label: 'Open now', value: openNow, accent: 'text-body' },
            { label: 'Awaiting review', value: awaitingReview.length, accent: awaitingReview.length > 0 ? 'text-yellow' : 'text-body' },
          ].map((stat) => (
            <div key={stat.label} className="bg-background-alt px-5 py-4">
              <p className={`font-semibold text-3xl leading-none tabular-nums ${stat.accent}`}>{stat.value}</p>
              <p className="mt-2 text-xs font-medium text-body-300">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      <PanicCard />

      {isLoading && (
        <div aria-label="Loading rooms" className="h-40 animate-pulse rounded-2xl bg-white/5 motion-reduce:animate-none" />
      )}

      {isError && (
        <div role="alert" className="flex items-center gap-3 text-sm text-red">
          Couldn&apos;t load rooms.
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-full border border-border/50 px-3 py-1.5 text-xs font-semibold text-body-300 hover:text-body"
          >
            Try again
          </button>
        </div>
      )}

      {awaitingReview.length > 0 && (
        <section aria-label="Rooms awaiting review" className="rounded-2xl border border-yellow/30 bg-yellow/[0.05] p-5">
          <h2 className="text-base font-semibold text-white">Awaiting review ({awaitingReview.length})</h2>
          <p className="mt-1 text-sm text-body-300">
            Hosts asked for the lobby. Approving lists the room publicly, so check it first.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {awaitingReview.map((room) => (
              <li key={room.slug} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-black-light/30 px-4 py-3">
                <span className="min-w-0 text-sm text-body">
                  <span className="font-medium text-white">{room.title}</span>
                  <span className="text-body-300">
                    {' '}/{room.slug} · requested {new Date(room.listingRequestedAt ?? '').toLocaleString()}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => void approve(room)}
                  disabled={saving}
                  className="shrink-0 rounded-full bg-green px-3.5 py-1.5 text-xs font-semibold text-black hover:brightness-110 disabled:opacity-50"
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rooms && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RoomFilterChips rooms={rooms} filter={filter} onChange={setFilter} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rooms"
            aria-label="Search rooms"
            className="h-9 w-full rounded-full border border-border/50 bg-black-light/35 px-4 text-sm text-body placeholder:text-body-700 focus:border-green/50 focus:outline-none sm:w-60"
          />
        </div>
      )}

      {rooms && shown?.length === 0 && (
        <p className="py-10 text-center text-sm text-body-700">
          {q ? 'No rooms match that search.' : `No ${filter === 'all' ? '' : `${filter} `}rooms.`}
        </p>
      )}

      <section aria-label="Room templates" className="grid gap-3 md:grid-cols-2">
        {shown?.map((room) => (
          <RoomCard
            key={room.slug}
            room={room}
            saving={saving}
            closingId={closingId}
            onApprove={(r) => void approve(r)}
            onEdit={setEditingSlug}
            onCloseInstance={(id) => void closeInstance(id)}
          />
        ))}
      </section>

      <Bans />

      {editingRoom && (
        <RoomEditPanel
          key={editingRoom.slug}
          room={editingRoom}
          saving={saving}
          onSave={(values) => void saveRoom(editingRoom.slug, values)}
          onClose={() => setEditingSlug(null)}
        />
      )}
    </div>
  );
};

export default RoomsAdmin;
