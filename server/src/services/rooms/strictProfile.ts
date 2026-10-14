import type { RoomRole, StrictRoomProfile } from '../../types/room.js';

/**
 * Listening-room (requiresModPresence) automod tightening — data only; the
 * normal `checkRoomMessage` path consumes it, there is no forked logic.
 * Calm over fast: slow floor 8 s, no links, no pings, short messages, and a
 * wider duplicate window so nobody can loop a message at a grieving room.
 */
export const strictProfile: StrictRoomProfile = {
  slowModeMinMs: 8_000,
  blockLinks: true,
  duplicateWindow: 8,
  maxLength: 280,
  blockMentions: true,
};

/**
 * Staff keep pace and may share a helpline link — only the length and ping
 * rules bind them. Everyone else (trusted members included) gets the full profile.
 */
export const strictProfileFor = (role: RoomRole): StrictRoomProfile =>
  role === 'member' ? strictProfile : { ...strictProfile, slowModeMinMs: 0, blockLinks: false };
