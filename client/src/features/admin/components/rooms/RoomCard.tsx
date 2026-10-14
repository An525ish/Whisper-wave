import type { AdminRoomRow, RoomEditForm as RoomEditValues } from '../../types';
import RoomEditForm from './edit/RoomEditForm';
import VisibilityBadge from './VisibilityBadge';

type Props = {
  room: AdminRoomRow;
  editing: boolean;
  saving: boolean;
  closingId: string | null;
  onApprove: (room: AdminRoomRow) => void;
  onEdit: (slug: string | null) => void;
  onSave: (slug: string, values: RoomEditValues) => void;
  onCloseInstance: (instanceId: string) => void;
};

const RoomCard = ({ room, editing, saving, closingId, onApprove, onEdit, onSave, onCloseInstance }: Props) => (
  <article className="rounded-2xl border border-border/60 bg-white/[0.03] p-4">
    <div className="flex items-center justify-between gap-2">
      <h2 className="font-semibold text-white">
        {room.title} <span className="font-normal text-body-300">/{room.slug}</span>
      </h2>
      <VisibilityBadge visibility={room.visibility} />
    </div>
    <p className="mt-1 text-sm text-body-300">
      {room.official ? 'Official' : 'Community'} · {room.open ? 'open' : 'closed'} ·{' '}
      {room.instances.length > 0 ? room.instances.map((i) => `#${i.n} (${i.online})`).join(', ') : 'empty'}
    </p>
    <div className="mt-3 flex flex-wrap gap-2">
      {room.visibility === 'unlisted' && (
        <button
          type="button"
          onClick={() => onApprove(room)}
          disabled={saving}
          className="rounded-full bg-green/15 px-3 py-1.5 text-xs font-medium text-green hover:bg-green/25 disabled:opacity-50"
        >
          Approve for lobby
        </button>
      )}
      <button
        type="button"
        onClick={() => onEdit(editing ? null : room.slug)}
        aria-expanded={editing}
        className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-body-300 hover:text-body"
      >
        {editing ? 'Close editor' : 'Edit'}
      </button>
      {room.instances.map((instance) => {
        const id = `${room.slug}#${instance.n}`;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onCloseInstance(id)}
            disabled={closingId === id}
            className="rounded-full border border-red/30 px-3 py-1.5 text-xs font-medium text-red hover:bg-red/10 disabled:opacity-50"
          >
            Close #{instance.n} ({instance.online})
          </button>
        );
      })}
    </div>
    {editing && (
      <RoomEditForm room={room} saving={saving} onSave={(values) => onSave(room.slug, values)} onCancel={() => onEdit(null)} />
    )}
  </article>
);

export default RoomCard;
