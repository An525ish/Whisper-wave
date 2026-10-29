import type { AdminRoomRow } from '../../types';
import VisibilityBadge from './VisibilityBadge';

type Props = {
  room: AdminRoomRow;
  saving: boolean;
  closingId: string | null;
  onApprove: (room: AdminRoomRow) => void;
  onEdit: (slug: string) => void;
  onCloseInstance: (instanceId: string) => void;
};

const TILES = [
  'from-[#4b3680] to-[#221639]',
  'from-[#175048] to-[#0d211d]',
  'from-[#1a5c3a] to-[#0e241b]',
  'from-[#31487a] to-[#141c30]',
];

const tileFor = (slug: string): string => {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return TILES[h % TILES.length] ?? TILES[0]!;
};

const Pill = ({ children, tone = 'plain' }: { children: React.ReactNode; tone?: 'plain' | 'good' | 'warn' }) => (
  <span
    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
      tone === 'good' ? 'bg-green/12 text-green' : tone === 'warn' ? 'bg-yellow/12 text-yellow' : 'bg-white/8 text-body-300'
    }`}
  >
    {children}
  </span>
);

const RoomCard = ({ room, saving, closingId, onApprove, onEdit, onCloseInstance }: Props) => {
  const live = room.instances.reduce((sum, i) => sum + i.online, 0);

  return (
    <article
      className="flex flex-col rounded-2xl border border-border/60 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-border hover:bg-white/[0.05] motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-lg font-bold text-white ring-1 ring-white/10 ${tileFor(room.slug)}`}
        >
          {(room.title.trim().charAt(0) || '?').toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="truncate font-semibold text-white">{room.title}</h2>
            <VisibilityBadge visibility={room.visibility} />
          </div>
          <p className="mt-0.5 truncate font-mono text-xs text-body-700">/{room.slug}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-semibold text-xl leading-none tabular-nums ${live > 0 ? 'text-green' : 'text-body-700'}`}>{live}</p>
          <p className="mt-1 text-[11px] text-body-300">online</p>
        </div>
      </div>

      {room.description && <p className="mt-3 line-clamp-2 text-sm text-body-300">{room.description}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Pill tone={room.open ? 'good' : 'warn'}>{room.open ? 'Open now' : 'Closed'}</Pill>
        {room.official && <Pill tone="good">Official</Pill>}
        {room.requiresModPresence && <Pill tone="warn">Listening room</Pill>}
        <Pill>{room.lang}</Pill>
        {room.media.length > 0 && <Pill>{room.media.join(' · ')}</Pill>}
        {room.mods.length > 0 && <Pill>{room.mods.length} {room.mods.length === 1 ? 'mod' : 'mods'}</Pill>}
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        {room.visibility === 'unlisted' && (
          <button
            type="button"
            onClick={() => onApprove(room)}
            disabled={saving}
            className="rounded-full bg-green px-3.5 py-1.5 text-xs font-semibold text-black hover:brightness-110 disabled:opacity-50"
          >
            Approve for lobby
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(room.slug)}
          className="rounded-full border border-border px-3.5 py-1.5 text-xs font-medium text-body-300 hover:border-white/25 hover:text-body"
        >
          Edit
        </button>
        {room.instances.map((instance) => {
          const id = `${room.slug}#${instance.n}`;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onCloseInstance(id)}
              disabled={closingId === id}
              className="inline-flex items-center gap-1.5 rounded-full border border-red/30 px-3 py-1.5 text-xs font-medium text-red hover:bg-red/10 disabled:opacity-50"
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-green" />
              Close #{instance.n} · {instance.online}
            </button>
          );
        })}
      </div>

    </article>
  );
};

export default RoomCard;
