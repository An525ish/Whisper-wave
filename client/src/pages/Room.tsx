import { useParams } from 'react-router-dom';
import { RoomScreen, RoomsGate } from '@/features/rooms';
import PageNotFound from './PageNotFound';

/** One room route — rules sheet until joined, live thread after. Thin entry. */
const Room = () => {
  const { slug } = useParams();
  if (!slug) return <PageNotFound />;
  return (
    <RoomsGate>
      <RoomScreen key={slug} slug={slug} />
    </RoomsGate>
  );
};

export default Room;
