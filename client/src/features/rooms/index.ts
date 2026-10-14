/**
 * Rooms feature — live topic rooms.
 * PUBLIC API: only what pages, the app shell and other features consume.
 */

// ── Hooks ──
export { useRoomsList } from './hooks/useRoomsQueries';

// ── Components ──
export { default as RoomsGate } from './components/RoomsGate';
export { default as RoomsLobby } from './components/RoomsLobby';
export { default as RoomScreen } from './components/RoomScreen';
export { default as CreateRoomSheet } from './components/CreateRoomSheet';
export { default as RoomsHubCard } from './components/RoomsHubCard';
