import RefreshButton from '../shared/RefreshButton';
import { useRoomsPage } from '../../hooks/useRoomsPage';
import Bans from './Bans';
import PanicCard from './PanicCard';
import RoomCard from './RoomCard';
import RoomFilterChips from './RoomFilterChips';

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

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-2xl text-white">Rooms</h1>
        <RefreshButton />
      </div>

      <PanicCard />

      <Bans />

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
        <section aria-label="Rooms awaiting review" className="rounded-2xl border border-yellow/30 bg-yellow/5 p-4">
          <h2 className="text-base font-semibold text-white">Awaiting review ({awaitingReview.length})</h2>
          <p className="mt-1 text-sm text-body-300">
            Hosts asked for the lobby. Approving lists the room publicly — check it first.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {awaitingReview.map((room) => (
              <li key={room.slug} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.02] px-3 py-2">
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
                  className="shrink-0 rounded-full bg-green/15 px-3 py-1.5 text-xs font-medium text-green hover:bg-green/25 disabled:opacity-50"
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {rooms && <RoomFilterChips rooms={rooms} filter={filter} onChange={setFilter} />}

      <section aria-label="Room templates" className="flex flex-col gap-3">
        {visibleRooms?.map((room) => (
          <RoomCard
            key={room.slug}
            room={room}
            editing={editingSlug === room.slug}
            saving={saving}
            closingId={closingId}
            onApprove={(r) => void approve(r)}
            onEdit={setEditingSlug}
            onSave={(slug, values) => void saveRoom(slug, values)}
            onCloseInstance={(id) => void closeInstance(id)}
          />
        ))}
      </section>
    </div>
  );
};

export default RoomsAdmin;
