import { RoomsGate, RoomsLobby } from '@/features/rooms';

/** Rooms lobby — live templates plus approved public rooms. Thin entry. */
const Rooms = () => (
  <RoomsGate>
    <RoomsLobby />
  </RoomsGate>
);

export default Rooms;
