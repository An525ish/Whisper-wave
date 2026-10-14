import { ROOM_FILTERS } from '../../constants/rooms';
import type { AdminRoomFilter, AdminRoomRow } from '../../types';

type Props = {
  rooms: AdminRoomRow[];
  filter: AdminRoomFilter;
  onChange: (filter: AdminRoomFilter) => void;
};

/** Visibility filter for the template list, each chip with its count. */
const RoomFilterChips = ({ rooms, filter, onChange }: Props) => (
  <div role="group" aria-label="Filter rooms by visibility" className="flex flex-wrap gap-2">
    {ROOM_FILTERS.map((id) => {
      const count = id === 'all' ? rooms.length : rooms.filter((r) => r.visibility === id).length;
      return (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          aria-pressed={filter === id}
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            filter === id ? 'bg-white/15 text-white' : 'border border-border text-body-300 hover:text-body'
          }`}
        >
          {id} ({count})
        </button>
      );
    })}
  </div>
);

export default RoomFilterChips;
