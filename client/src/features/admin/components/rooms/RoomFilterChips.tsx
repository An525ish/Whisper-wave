import { ROOM_FILTERS } from '../../constants/rooms';
import type { AdminRoomFilter, AdminRoomRow } from '../../types';

type Props = {
  rooms: AdminRoomRow[];
  filter: AdminRoomFilter;
  onChange: (filter: AdminRoomFilter) => void;
};

/** Visibility filter for the template list, as one segmented control with counts. */
const RoomFilterChips = ({ rooms, filter, onChange }: Props) => (
  <div
    role="group"
    aria-label="Filter rooms by visibility"
    className="flex w-fit max-w-full flex-wrap gap-1 rounded-full border border-border/50 bg-black-light/35 p-1"
  >
    {ROOM_FILTERS.map((id) => {
      const count = id === 'all' ? rooms.length : rooms.filter((r) => r.visibility === id).length;
      const on = filter === id;
      return (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={on}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition ${
            on ? 'bg-white/12 text-white shadow-sm' : 'text-body-300 hover:text-body'
          }`}
        >
          {id}
          <span className={`ml-1.5 tabular-nums ${on ? 'text-body' : 'text-body-700'}`}>{count}</span>
        </button>
      );
    })}
  </div>
);

export default RoomFilterChips;
