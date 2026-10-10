import { useState } from 'react';
import {
  useAdminRoomsQuery,
  useCloseInstanceMutation,
  useFeatureFlagMutation,
  useUpsertRoomMutation,
} from '@/features/admin/hooks';
import type { AdminRoomRow } from '@/features/admin/types';
import { useHubSummary } from '@/features/hub';
import Bans from './Bans';

/**
 * The incident switch: one surface off or back on immediately, no deploy.
 * A restart resets to env — flags stay the durable state, this is the panic
 * button. Logged server-side as such.
 */
const PanicCard = () => {
  const { data: summary } = useHubSummary();
  const flip = useFeatureFlagMutation();
  const features = summary?.features;

  const items = [
    { id: 'rooms' as const, label: 'Rooms' },
    { id: 'games' as const, label: 'Games' },
    { id: 'memes' as const, label: 'Memes' },
  ];

  return (
    <section aria-label="Feature kill switches" className="rounded-2xl border border-red/30 bg-red/5 p-5">
      <h2 className="text-base font-semibold text-white">Panic card</h2>
      <p className="mt-1 text-sm text-body-300">
        Disable a surface instantly. A restart resets to deploy flags.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => {
          const on = features?.[item.id] ?? false;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => flip.mutate({ feature: item.id, enabled: !on })}
              disabled={flip.isPending}
              aria-pressed={on}
              className={`rounded-full px-4 py-2 text-sm font-medium transition disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red ${
                on
                  ? 'bg-red/20 text-red hover:bg-red/30'
                  : 'border border-border bg-white/5 text-body-300 hover:text-body'
              }`}
            >
              {item.label}: {on ? 'ON — disable' : 'off — enable'}
            </button>
          );
        })}
      </div>
    </section>
  );
};

const VisibilityBadge = ({ visibility }: { visibility: AdminRoomRow['visibility'] }) => {
  const tone =
    visibility === 'official'
      ? 'bg-green/15 text-green'
      : visibility === 'public'
        ? 'bg-white/10 text-body'
        : 'bg-yellow/15 text-yellow';
  return (
    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
      {visibility}
    </span>
  );
};

/**
 * Room templates with live occupancy. Approving a user room for the lobby is
 * one visibility flip to `public` — unlisted rooms never appear publicly.
 */
const RoomsAdmin = () => {
  const { data: rooms, isLoading } = useAdminRoomsQuery();
  const upsert = useUpsertRoomMutation();
  const closeInstance = useCloseInstanceMutation();
  const [closingId, setClosingId] = useState<string | null>(null);

  const approve = (room: AdminRoomRow) => {
    upsert.mutate({
      slug: room.slug,
      title: room.title,
      description: room.description,
      rules: room.rules,
      lang: room.lang,
      official: room.official,
      hours: room.hours,
      visibility: 'public',
    });
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      <h1 className="font-display text-2xl text-white">Rooms</h1>

      <PanicCard />

      <Bans />

      {isLoading && (
        <div aria-label="Loading rooms" className="h-40 animate-pulse rounded-2xl bg-white/5 motion-reduce:animate-none" />
      )}

      {rooms && rooms.some((r) => r.visibility === 'unlisted' && r.listingRequestedAt) && (
        <section aria-label="Rooms awaiting review" className="rounded-2xl border border-yellow/30 bg-yellow/5 p-4">
          <h2 className="text-base font-semibold text-white">
            Awaiting review ({rooms.filter((r) => r.visibility === 'unlisted' && r.listingRequestedAt).length})
          </h2>
          <p className="mt-1 text-sm text-body-300">
            Hosts asked for the lobby. Approving lists the room publicly — check it first.
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            {rooms
              .filter((r) => r.visibility === 'unlisted' && r.listingRequestedAt)
              .map((room) => (
                <li key={room.slug} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.02] px-3 py-2">
                  <span className="min-w-0 text-sm text-body">
                    <span className="font-medium text-white">{room.title}</span>
                    <span className="text-body-300"> /{room.slug} · requested {new Date(room.listingRequestedAt as string).toLocaleString()}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => approve(room)}
                    disabled={upsert.isPending}
                    className="shrink-0 rounded-full bg-green/15 px-3 py-1.5 text-xs font-medium text-green hover:bg-green/25 disabled:opacity-50"
                  >
                    Approve
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}

      <section aria-label="Room templates" className="flex flex-col gap-3">
        {rooms?.map((room) => (
          <article key={room.slug} className="rounded-2xl border border-border/60 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-white">
                {room.title} <span className="font-normal text-body-300">/{room.slug}</span>
              </h2>
              <VisibilityBadge visibility={room.visibility} />
            </div>
            <p className="mt-1 text-sm text-body-300">
              {room.official ? 'Official' : 'Community'} · {room.open ? 'open' : 'closed'} ·{' '}
              {room.instances.length > 0
                ? room.instances.map((i) => `#${i.n} (${i.online})`).join(', ')
                : 'empty'}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {room.visibility === 'unlisted' && (
                <button
                  type="button"
                  onClick={() => approve(room)}
                  disabled={upsert.isPending}
                  className="rounded-full bg-green/15 px-3 py-1.5 text-xs font-medium text-green hover:bg-green/25 disabled:opacity-50"
                >
                  Approve for lobby
                </button>
              )}
              {room.instances.map((instance) => {
                const id = `${room.slug}#${instance.n}`;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setClosingId(id);
                      closeInstance.mutate(
                        { instanceId: id },
                        { onSettled: () => setClosingId(null) }
                      );
                    }}
                    disabled={closingId === id}
                    className="rounded-full border border-red/30 px-3 py-1.5 text-xs font-medium text-red hover:bg-red/10 disabled:opacity-50"
                  >
                    Close #{instance.n} ({instance.online})
                  </button>
                );
              })}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default RoomsAdmin;
