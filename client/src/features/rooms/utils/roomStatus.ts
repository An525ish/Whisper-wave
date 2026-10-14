import type { RoomSummary } from '../types';

/** Whether the door is open to enter: only hours close a room — a mod-less listening room can still be read. */
export const isJoinable = (room: Pick<RoomSummary, 'status'>): boolean => room.status !== 'closed';
