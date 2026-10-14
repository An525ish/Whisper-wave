import type { ReactNode } from 'react';
import { useRoomsEnabled } from '../hooks/useRoomsEnabled';
import RoomStateCard from './RoomStateCard';

type Props = {
  children: ReactNode;
};

/** Rooms pages render only while the server's `rooms` flag is on. */
const RoomsGate = ({ children }: Props) => {
  const { pending, enabled } = useRoomsEnabled();
  if (pending) return null;
  if (!enabled) return <RoomStateCard state={{ kind: 'switched_off' }} />;
  return <>{children}</>;
};

export default RoomsGate;
