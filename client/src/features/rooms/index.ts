/**
 * Rooms feature — live topic rooms.
 * PUBLIC API: only what pages, the app shell and other features consume.
 */

// ── Hooks ──
export { useRoomsList, useRoomInfo } from './hooks/useRoomsQueries';
export { useRoomsSocket } from './hooks/useRoomsSocket';
export { useReportRoomMutation, useCreateRoomMutation } from './hooks/useRoomMutations';

// ── Components ──
export { default as RoomsLobby } from './components/RoomsLobby';
export { default as RoomScreen } from './components/RoomScreen';
export { default as CreateRoomSheet } from './components/CreateRoomSheet';
