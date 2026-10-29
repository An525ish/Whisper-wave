import type { AdminFeatureFlag, AdminRoomFilter, AdminRoomVisibility } from '../types';

/** Kill switches surfaced on the panic card. `games` is a server flag but has no admin UI. */
export const PANIC_FEATURES: ReadonlyArray<{ id: AdminFeatureFlag; label: string }> = [
  { id: 'rooms', label: 'Rooms' },
  { id: 'privateRooms', label: 'Private rooms' },
  { id: 'memes', label: 'Memes' },
];

export const ROOM_VISIBILITIES: readonly AdminRoomVisibility[] = ['official', 'public', 'unlisted', 'private'];

/** Admins never move a room across the private boundary (server 422s); the form offers only the matching side. */
export const selectableVisibilities = (current: AdminRoomVisibility): readonly AdminRoomVisibility[] =>
  ROOM_VISIBILITIES.filter((v) => (current === 'private' ? v === 'private' : v !== 'private'));

export const ROOM_FILTERS: ReadonlyArray<AdminRoomFilter> = ['all', ...ROOM_VISIBILITIES];

export const ROOM_MAX_RULES = 10;
export const ROOM_MAX_MODS = 20;

export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

/** Media a room can allow for members. Mirrors the server's `ROOM_MEDIA_KINDS`. */
export const ROOM_MEDIA_KINDS = ['image', 'gif', 'meme'] as const;
