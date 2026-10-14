import { MemesHubCard } from '@/features/memes';
import { RoomsHubCard } from '@/features/rooms';
import { WhisperHubCard } from '@/features/whisper';

type Props = {
  roomsLive: boolean;
  memesLive: boolean;
  quotaExhausted: boolean;
  onDoorClick: (id: string) => void;
};

const COLUMNS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
};

/**
 * The launcher row. Each door is owned by its feature (HUB_PLAN §7.1) —
 * this only lays them out. Dark surfaces render nothing, so the grid sizes
 * itself to the doors that exist.
 */
const HomeDoors = ({ roomsLive, memesLive, quotaExhausted, onDoorClick }: Props) => {
  const count = 1 + Number(roomsLive) + Number(memesLive);

  return (
    <nav aria-label="Where to tonight" className={`grid gap-3 ${COLUMNS[count]}`}>
      <WhisperHubCard
        quotaExhausted={quotaExhausted}
        onClick={() => onDoorClick('whisper-door')}
      />
      <RoomsHubCard enabled={roomsLive} onClick={() => onDoorClick('rooms-door')} />
      <MemesHubCard enabled={memesLive} onClick={() => onDoorClick('memes-door')} />
    </nav>
  );
};

export default HomeDoors;
