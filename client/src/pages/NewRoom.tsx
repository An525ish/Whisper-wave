import { CreateRoomSheet, RoomsGate } from '@/features/rooms';

/** User room creation (members only). Thin entry. */
const NewRoom = () => (
  <RoomsGate>
    <CreateRoomSheet />
  </RoomsGate>
);

export default NewRoom;
